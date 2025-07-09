-- Fix current_user syntax error in RLS policies
-- Date: 2025-01-08
-- Problem: current_user is a reserved keyword and cannot be used as table alias

-- Step 1: Check current policies that might have the error
SELECT 'CURRENT POLICIES (checking for syntax errors):' as info;
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'tasks' AND schemaname = 'public'
ORDER BY policyname;

-- Step 2: Drop ALL existing policies to start fresh
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
DROP POLICY IF EXISTS "tasks_select_v2" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_v2" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_v2" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_v2" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select_assigned" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_assigned" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_assigned" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_assigned" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select_assessora_adm" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select_by_role" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select_simple" ON public.tasks;

-- Step 3: Create new SELECT policy without using current_user as alias
CREATE POLICY "tasks_select_fixed" 
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
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('admin', 'franqueado')
    )
    OR
    -- ASSESSORA ADM sees ALL assessora ADM tasks
    (
      EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.user_id = auth.uid() AND up.role = 'assessora_adm'
      )
      AND
      created_by IN (
        SELECT user_id FROM public.user_profiles up
        WHERE up.role = 'assessora_adm' AND up.is_active = true
      )
    )
    OR
    -- ASSESSORA ADM sees tasks assigned to other assessoras ADM
    (
      EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.user_id = auth.uid() AND up.role = 'assessora_adm'
      )
      AND
      EXISTS (
        SELECT 1 
        FROM unnest(assigned_users) AS assigned_user
        JOIN public.user_profiles up ON assigned_user = up.user_id
        WHERE up.role = 'assessora_adm'
      )
    )
    OR
    -- Coordenador sees subordinates
    (
      EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.user_id = auth.uid() AND up.role = 'coordenador'
      )
      AND
      created_by IN (
        SELECT user_id FROM public.user_profiles up
        WHERE up.role IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm')
      )
    )
    OR
    -- Supervisor ADM sees subordinates
    (
      EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.user_id = auth.uid() AND up.role = 'supervisor_adm'
      )
      AND
      created_by IN (
        SELECT user_id FROM public.user_profiles up
        WHERE up.role IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm')
      )
    )
    OR
    -- Professor sees other professors
    (
      EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.user_id = auth.uid() AND up.role = 'professor'
      )
      AND
      created_by IN (
        SELECT user_id FROM public.user_profiles up
        WHERE up.role = 'professor'
      )
    )
  );

-- Step 4: Create INSERT policy
CREATE POLICY "tasks_insert_fixed" 
  ON public.tasks FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

-- Step 5: Create UPDATE policy
CREATE POLICY "tasks_update_fixed" 
  ON public.tasks FOR UPDATE 
  USING (
    auth.uid() = created_by 
    OR 
    auth.uid() = ANY(assigned_users) 
    OR
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('admin', 'franqueado')
    )
  );

-- Step 6: Create DELETE policy
CREATE POLICY "tasks_delete_fixed" 
  ON public.tasks FOR DELETE 
  USING (
    auth.uid() = created_by 
    OR
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('admin', 'franqueado')
    )
  );

-- Step 7: Verify the fix
SELECT 'FIXED POLICIES CREATED:' as info;
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'tasks' AND schemaname = 'public'
ORDER BY policyname;

-- Step 8: Success message
SELECT 'SUCCESS: Fixed current_user syntax error! All policies now use proper table aliases.' as result; 