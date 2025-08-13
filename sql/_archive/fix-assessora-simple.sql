-- SIMPLE FIX FOR ASSESSORA ADM TASK VISIBILITY
-- Date: 2025-01-08
-- Approach: Simple and direct RLS policy

-- Step 1: Drop all existing policies
DROP POLICY IF EXISTS "tasks_select_v3" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_v3" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_v3" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_v3" ON public.tasks;

-- Step 2: Create SIMPLE SELECT policy
CREATE POLICY "tasks_select_simple" 
  ON public.tasks FOR SELECT 
  USING (
    -- Own tasks
    auth.uid() = created_by 
    OR
    -- Assigned tasks
    auth.uid() = ANY(assigned_users) 
    OR
    -- Admin/Franqueado see all
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'franqueado')
    )
    OR
    -- ASSESSORA ADM sees all assessora ADM tasks (SIMPLIFIED)
    (
      -- Current user is assessora ADM
      (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) = 'assessora_adm'
      AND
      -- Task creator is assessora ADM
      (SELECT role FROM public.user_profiles WHERE user_id = created_by) = 'assessora_adm'
    )
    OR
    -- Coordenador sees subordinates
    (
      (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) = 'coordenador'
      AND
      (SELECT role FROM public.user_profiles WHERE user_id = created_by) IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm')
    )
    OR
    -- Supervisor ADM sees subordinates
    (
      (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) = 'supervisor_adm'
      AND
      (SELECT role FROM public.user_profiles WHERE user_id = created_by) IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm')
    )
    OR
    -- Professor sees other professors
    (
      (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) = 'professor'
      AND
      (SELECT role FROM public.user_profiles WHERE user_id = created_by) = 'professor'
    )
  );

-- Step 3: Create other policies
CREATE POLICY "tasks_insert_simple" 
  ON public.tasks FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "tasks_update_simple" 
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

CREATE POLICY "tasks_delete_simple" 
  ON public.tasks FOR DELETE 
  USING (
    auth.uid() = created_by 
    OR
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'franqueado')
    )
  );

-- Step 4: Test the policy
SELECT 'TESTING: Current policies' as test;
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'tasks' AND schemaname = 'public';

-- Step 5: Success message
SELECT 'SUCCESS: Simple RLS policies created for assessora ADM' as result; 