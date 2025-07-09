-- Complete RLS Fix - Remove ALL policies and recreate
-- Date: 2025-01-08

-- Step 1: Show current policies before cleanup
SELECT 'BEFORE - Current policies:' as info;
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'tasks' AND schemaname = 'public';

-- Step 2: Drop ALL possible policy names that might exist
DROP POLICY IF EXISTS "Usuários podem ver tarefas pela hierarquia" ON public.tasks;
DROP POLICY IF EXISTS "Usuários podem atualizar tarefas pela hierarquia" ON public.tasks;
DROP POLICY IF EXISTS "Usuários podem criar tarefas" ON public.tasks;
DROP POLICY IF EXISTS "Usuários podem deletar tarefas" ON public.tasks;
DROP POLICY IF EXISTS "Criadores e admins podem deletar tarefas" ON public.tasks;
DROP POLICY IF EXISTS "Tasks - Select Policy" ON public.tasks;
DROP POLICY IF EXISTS "Tasks - Insert Policy" ON public.tasks;
DROP POLICY IF EXISTS "Tasks - Update Policy" ON public.tasks;
DROP POLICY IF EXISTS "Tasks - Delete Policy" ON public.tasks;
DROP POLICY IF EXISTS "Usuários podem ver tarefas relacionadas" ON public.tasks;
DROP POLICY IF EXISTS "Usuários podem atualizar tarefas próprias ou atribuídas" ON public.tasks;

-- Step 3: Show policies after cleanup
SELECT 'AFTER CLEANUP - Remaining policies:' as info;
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'tasks' AND schemaname = 'public';

-- Step 4: Create NEW SELECT policy with assessora ADM fix
CREATE POLICY "tasks_select_policy" 
  ON public.tasks FOR SELECT 
  USING (
    -- Own tasks
    auth.uid() = created_by 
    OR
    -- Assigned tasks
    auth.uid() = ANY(assigned_users) 
    OR
    -- Admin and Franqueado see everything
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'franqueado')
    )
    OR
    -- ASSESSORA ADM sees ALL assessora ADM tasks
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
    -- Coordenador sees subordinates
    (
      EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'coordenador'
      )
      AND
      created_by IN (
        SELECT user_id FROM public.user_profiles 
        WHERE role IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm')
      )
    )
    OR
    -- Supervisor ADM sees subordinates
    (
      EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'supervisor_adm'
      )
      AND
      created_by IN (
        SELECT user_id FROM public.user_profiles 
        WHERE role IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm')
      )
    )
    OR
    -- Professor sees other professors
    (
      EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'professor'
      )
      AND
      created_by IN (
        SELECT user_id FROM public.user_profiles 
        WHERE role = 'professor'
      )
    )
  );

-- Step 5: Create other policies
CREATE POLICY "tasks_insert_policy" 
  ON public.tasks FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "tasks_update_policy" 
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

CREATE POLICY "tasks_delete_policy" 
  ON public.tasks FOR DELETE 
  USING (
    auth.uid() = created_by 
    OR
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'franqueado')
    )
  );

-- Step 6: Verify final state
SELECT 'FINAL - New policies created:' as info;
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'tasks' AND schemaname = 'public';

-- Step 7: Test data for assessoras
SELECT 'All assessoras:' as test_info;
SELECT name, role, is_active 
FROM public.user_profiles 
WHERE role = 'assessora_adm'
ORDER BY name;

SELECT 'Tasks by assessoras:' as test_info;
SELECT t.title, up.name as creator 
FROM public.tasks t
JOIN public.user_profiles up ON t.created_by = up.user_id
WHERE up.role = 'assessora_adm'
ORDER BY t.created_at DESC;

SELECT 'SUCCESS: All policies recreated! Assessora ADM should now see ALL tasks from other assessoras.' as result; 