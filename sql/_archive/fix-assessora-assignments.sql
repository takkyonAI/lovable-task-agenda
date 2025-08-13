-- FIX ASSESSORA ADM TASK VISIBILITY - INCLUDE ASSIGNED TASKS
-- Date: 2025-01-08
-- Problem: Assessora ADM should see tasks ASSIGNED to other assessoras ADM, not just CREATED by them

-- Step 1: Drop existing policies
DROP POLICY IF EXISTS "tasks_select_simple" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_simple" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_simple" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_simple" ON public.tasks;

-- Step 2: Create corrected SELECT policy with assigned tasks support
CREATE POLICY "tasks_select_assigned" 
  ON public.tasks FOR SELECT 
  USING (
    -- Own tasks (created by user)
    auth.uid() = created_by 
    OR
    -- Tasks assigned to user
    auth.uid() = ANY(assigned_users) 
    OR
    -- Admin/Franqueado see all
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'franqueado')
    )
    OR
    -- ASSESSORA ADM sees tasks CREATED by other assessoras ADM
    (
      (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) = 'assessora_adm'
      AND
      (SELECT role FROM public.user_profiles WHERE user_id = created_by) = 'assessora_adm'
    )
    OR
    -- CRITICAL FIX: ASSESSORA ADM sees tasks ASSIGNED to other assessoras ADM
    (
      (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) = 'assessora_adm'
      AND
      EXISTS (
        SELECT 1 
        FROM public.user_profiles up 
        WHERE up.role = 'assessora_adm' 
        AND up.user_id = ANY(assigned_users)
      )
    )
    OR
    -- Coordenador sees subordinates (created by)
    (
      (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) = 'coordenador'
      AND
      (SELECT role FROM public.user_profiles WHERE user_id = created_by) IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm')
    )
    OR
    -- Coordenador sees tasks assigned to subordinates
    (
      (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) = 'coordenador'
      AND
      EXISTS (
        SELECT 1 
        FROM public.user_profiles up 
        WHERE up.role IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm')
        AND up.user_id = ANY(assigned_users)
      )
    )
    OR
    -- Supervisor ADM sees subordinates (created by)
    (
      (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) = 'supervisor_adm'
      AND
      (SELECT role FROM public.user_profiles WHERE user_id = created_by) IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm')
    )
    OR
    -- Supervisor ADM sees tasks assigned to subordinates
    (
      (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) = 'supervisor_adm'
      AND
      EXISTS (
        SELECT 1 
        FROM public.user_profiles up 
        WHERE up.role IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm')
        AND up.user_id = ANY(assigned_users)
      )
    )
    OR
    -- Professor sees tasks created by other professors
    (
      (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) = 'professor'
      AND
      (SELECT role FROM public.user_profiles WHERE user_id = created_by) = 'professor'
    )
    OR
    -- Professor sees tasks assigned to other professors
    (
      (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) = 'professor'
      AND
      EXISTS (
        SELECT 1 
        FROM public.user_profiles up 
        WHERE up.role = 'professor'
        AND up.user_id = ANY(assigned_users)
      )
    )
  );

-- Step 3: Create other policies
CREATE POLICY "tasks_insert_assigned" 
  ON public.tasks FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "tasks_update_assigned" 
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

CREATE POLICY "tasks_delete_assigned" 
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

-- Step 5: Show what assessora ADM should see now
SELECT 'WHAT ASSESSORA ADM SHOULD SEE:' as info;
SELECT '1. Tasks created by herself' as rule1;
SELECT '2. Tasks assigned to herself' as rule2;
SELECT '3. Tasks created by other assessoras ADM' as rule3;
SELECT '4. Tasks assigned to other assessoras ADM (THIS WAS MISSING!)' as rule4;

-- Step 6: Success message
SELECT 'SUCCESS: RLS policies updated to include ASSIGNED tasks for assessora ADM!' as result; 