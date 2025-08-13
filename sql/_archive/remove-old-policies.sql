-- REMOVE OLD RLS POLICIES THAT ARE CONFLICTING
-- Date: 2025-01-08
-- Problem: Old policies are conflicting with new ones

-- Step 1: Remove old policies (v3 versions)
DROP POLICY IF EXISTS "tasks_select_v3" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_v3" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_v3" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_v3" ON public.tasks;

-- Step 2: Remove other old policies that might conflict
DROP POLICY IF EXISTS "tasks_select_simple" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_simple" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_simple" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_simple" ON public.tasks;

-- Step 3: Verify remaining policies
SELECT 'REMAINING POLICIES AFTER CLEANUP:' as info;
SELECT policyname, cmd
FROM pg_policies 
WHERE tablename = 'tasks' AND schemaname = 'public'
ORDER BY policyname;

-- Step 4: Success message
SELECT 'SUCCESS: Old conflicting policies removed!' as result; 