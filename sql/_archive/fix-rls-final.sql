-- Fix Task Visibility RLS Policies - Final Version
-- This script completely replaces RLS policies to ensure assessoras can see each other's tasks
-- Date: 2025-01-08

-- Step 1: Check current policies
SELECT 'Current RLS policies:' as info;
SELECT policyname, cmd, permissive, roles, qual 
FROM pg_policies 
WHERE tablename = 'tasks' AND schemaname = 'public';

-- Step 2: Drop ALL existing policies for tasks to start fresh
DROP POLICY IF EXISTS "Usuários podem ver tarefas pela hierarquia" ON public.tasks;
DROP POLICY IF EXISTS "Usuários podem atualizar tarefas pela hierarquia" ON public.tasks;
DROP POLICY IF EXISTS "Usuários podem criar tarefas" ON public.tasks;
DROP POLICY IF EXISTS "Usuários podem deletar tarefas" ON public.tasks;
DROP POLICY IF EXISTS "Criadores e admins podem deletar tarefas" ON public.tasks;

-- Step 3: Create comprehensive SELECT policy - SIMPLIFIED FOR DEBUGGING
CREATE POLICY "Tasks - Select Policy" 
  ON public.tasks FOR SELECT 
  USING (
    -- 1. Criador sempre pode ver
    auth.uid() = created_by 
    OR
    -- 2. Usuário atribuído pode ver
    auth.uid() = ANY(assigned_users) 
    OR
    -- 3. Admin e Franqueado veem tudo
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'franqueado')
    )
    OR
    -- 4. ASSESSORA ADM vê tarefas de TODAS as assessoras ADM
    (
      EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'assessora_adm'
      )
      AND
      created_by IN (
        SELECT user_id FROM public.user_profiles 
        WHERE role = 'assessora_adm' AND is_active = true
      )
    )
    OR
    -- 5. Coordenador vê seus subordinados
    (
      EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'coordenador'
      )
      AND
      created_by IN (
        SELECT user_id FROM public.user_profiles 
        WHERE role IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm') AND is_active = true
      )
    )
    OR
    -- 6. Supervisor ADM vê seus subordinados
    (
      EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'supervisor_adm'
      )
      AND
      created_by IN (
        SELECT user_id FROM public.user_profiles 
        WHERE role IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm') AND is_active = true
      )
    )
    OR
    -- 7. Professor vê outros professores
    (
      EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'professor'
      )
      AND
      created_by IN (
        SELECT user_id FROM public.user_profiles 
        WHERE role = 'professor' AND is_active = true
      )
    )
  );

-- Step 4: Create INSERT policy
CREATE POLICY "Tasks - Insert Policy" 
  ON public.tasks FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

-- Step 5: Create UPDATE policy
CREATE POLICY "Tasks - Update Policy" 
  ON public.tasks FOR UPDATE 
  USING (
    auth.uid() = created_by 
    OR 
    auth.uid() = ANY(assigned_users) 
    OR
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'franqueado')
    )
  );

-- Step 6: Create DELETE policy
CREATE POLICY "Tasks - Delete Policy" 
  ON public.tasks FOR DELETE 
  USING (
    auth.uid() = created_by 
    OR
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'franqueado')
    )
  );

-- Step 7: Test the new policies specifically for assessora_adm
SELECT 'Testing assessora_adm visibility...' as test_info;

-- Show all assessoras in the system
SELECT 'All assessoras in system:' as info;
SELECT user_id, name, email, role, is_active 
FROM public.user_profiles 
WHERE role = 'assessora_adm'
ORDER BY name;

-- Show all tasks created by assessoras
SELECT 'All tasks created by assessoras:' as info;
SELECT t.id, t.title, t.created_by, up.name as creator_name, up.role as creator_role
FROM public.tasks t
JOIN public.user_profiles up ON t.created_by = up.user_id
WHERE up.role = 'assessora_adm'
ORDER BY t.created_at DESC;

-- Step 8: Verify RLS is enabled
SELECT 'RLS Status:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'tasks' AND schemaname = 'public';

-- Step 9: Success message
SELECT 'SUCCESS: New RLS policies created!' as result;
SELECT 'Assessora ADM should now see ALL tasks created by other assessoras.' as expected_behavior;
SELECT 'Test in the application now.' as next_step; 