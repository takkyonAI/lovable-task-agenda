-- FIX ASSESSORA ADM TASK VISIBILITY - FINAL SOLUTION
-- Date: 2025-01-08
-- Problem: Assessora ADM can only see her own tasks, not tasks from other assessoras

-- Step 1: Show current situation
SELECT 'BEFORE FIX - Current policies:' as info;
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'tasks' AND schemaname = 'public';

-- Step 2: Remove ALL existing policies to start fresh
DROP POLICY IF EXISTS "Usuários podem ver tarefas pela hierarquia" ON public.tasks;
DROP POLICY IF EXISTS "Usuários podem atualizar tarefas pela hierarquia" ON public.tasks;
DROP POLICY IF EXISTS "Usuários podem criar tarefas" ON public.tasks;
DROP POLICY IF EXISTS "Usuários podem deletar tarefas" ON public.tasks;
DROP POLICY IF EXISTS "Criadores e admins podem deletar tarefas" ON public.tasks;
DROP POLICY IF EXISTS "Tasks - Select Policy" ON public.tasks;
DROP POLICY IF EXISTS "Tasks - Insert Policy" ON public.tasks;
DROP POLICY IF EXISTS "Tasks - Update Policy" ON public.tasks;
DROP POLICY IF EXISTS "Tasks - Delete Policy" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select_policy" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_policy" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_policy" ON public.tasks;
DROP POLICY IF EXISTS "Usuários podem ver tarefas relacionadas" ON public.tasks;
DROP POLICY IF EXISTS "Usuários podem atualizar tarefas próprias ou atribuídas" ON public.tasks;

-- Step 3: Create new SELECT policy with specific fix for assessora ADM
CREATE POLICY "tasks_select_v2" 
  ON public.tasks FOR SELECT 
  USING (
    -- 1. Own tasks (creator can always see)
    auth.uid() = created_by 
    OR
    -- 2. Assigned tasks (assigned users can see)
    auth.uid() = ANY(assigned_users) 
    OR
    -- 3. Admin and Franqueado see everything
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'franqueado')
    )
    OR
    -- 4. CRITICAL FIX: Assessora ADM sees ALL tasks from other assessoras ADM
    (
      EXISTS (
        SELECT 1 FROM public.user_profiles current_user
        WHERE current_user.user_id = auth.uid() 
        AND current_user.role = 'assessora_adm'
        AND current_user.is_active = true
      )
      AND
      EXISTS (
        SELECT 1 FROM public.user_profiles task_creator
        WHERE task_creator.user_id = created_by 
        AND task_creator.role = 'assessora_adm'
        AND task_creator.is_active = true
      )
    )
    OR
    -- 5. Coordenador sees subordinates  
    (
      EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'coordenador'
      )
      AND
      EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = created_by AND role IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm')
      )
    )
    OR
    -- 6. Supervisor ADM sees subordinates
    (
      EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'supervisor_adm'
      )
      AND
      EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = created_by AND role IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm')
      )
    )
    OR
    -- 7. Professor sees other professors
    (
      EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'professor'
      )
      AND
      EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = created_by AND role = 'professor'
      )
    )
  );

-- Step 4: Create INSERT policy
CREATE POLICY "tasks_insert_v2" 
  ON public.tasks FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

-- Step 5: Create UPDATE policy
CREATE POLICY "tasks_update_v2" 
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
    OR
    -- Assessora ADM can update tasks from other assessoras ADM
    (
      EXISTS (
        SELECT 1 FROM public.user_profiles current_user
        WHERE current_user.user_id = auth.uid() 
        AND current_user.role = 'assessora_adm'
        AND current_user.is_active = true
      )
      AND
      EXISTS (
        SELECT 1 FROM public.user_profiles task_creator
        WHERE task_creator.user_id = created_by 
        AND task_creator.role = 'assessora_adm'
        AND task_creator.is_active = true
      )
    )
  );

-- Step 6: Create DELETE policy
CREATE POLICY "tasks_delete_v2" 
  ON public.tasks FOR DELETE 
  USING (
    auth.uid() = created_by 
    OR
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'franqueado')
    )
  );

-- Step 7: Test the fix
SELECT 'TESTING FIX - All assessoras:' as test_info;
SELECT 
    user_id,
    name,
    email,
    role,
    is_active
FROM public.user_profiles 
WHERE role = 'assessora_adm'
ORDER BY name;

SELECT 'TESTING FIX - All tasks by assessoras:' as test_info;
SELECT 
    t.id,
    t.title,
    t.status,
    t.created_by,
    up.name as creator_name,
    up.role as creator_role,
    t.created_at
FROM public.tasks t
JOIN public.user_profiles up ON t.created_by = up.user_id
WHERE up.role = 'assessora_adm'
ORDER BY t.created_at DESC;

-- Step 8: Show final policies
SELECT 'AFTER FIX - New policies:' as info;
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'tasks' AND schemaname = 'public';

-- Step 9: Success message
SELECT 'SUCCESS: Assessora ADM policy fixed!' as result;
SELECT 'Now assessora ADM should see ALL tasks from other assessoras of the same level' as expected_behavior; 