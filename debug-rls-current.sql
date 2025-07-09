-- Debug script to test current RLS policies for assessora ADM
-- This will help understand why only 3 tasks are being returned

-- Step 1: Get assessora ADM user ID
SELECT 'ASSESSORA ADM USER:' as info;
SELECT user_id, email, name, role 
FROM user_profiles 
WHERE email = 'tatianarbeiroadvogada@gmail.com';

-- Step 2: Set the current user context (replace with actual user ID)
-- This simulates what happens when the user is logged in
-- You'll need to replace 'b0dd7f6-55fe-4c28-ac90-368addcb5f9b' with the actual user ID

-- Step 3: Show all tasks in the database
SELECT 'ALL TASKS IN DATABASE:' as info;
SELECT COUNT(*) as total_tasks FROM tasks;
SELECT id, title, status, created_by, assigned_users 
FROM tasks 
ORDER BY created_at DESC;

-- Step 4: Test what the current RLS policy allows for assessora ADM
-- This simulates the exact query made by the frontend
SELECT 'WHAT RLS ALLOWS FOR ASSESSORA ADM:' as info;

-- Simulate the user context
SET SESSION AUTHORIZATION 'b0dd7f6-55fe-4c28-ac90-368addcb5f9b';

-- Now try the same query the frontend makes
SELECT id, title, status, created_by, assigned_users 
FROM tasks 
ORDER BY created_at DESC;

-- Reset to superuser
RESET SESSION AUTHORIZATION;

-- Step 5: Check current RLS policies
SELECT 'CURRENT RLS POLICIES:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'tasks' 
ORDER BY policyname;

-- Step 6: Test specific conditions
SELECT 'SPECIFIC CONDITION TESTS:' as info;

-- Test 1: Tasks created by assessora ADM
SELECT 'Tasks created by assessora ADM:' as test1;
SELECT COUNT(*) as count 
FROM tasks 
WHERE created_by = 'b0dd7f6-55fe-4c28-ac90-368addcb5f9b';

-- Test 2: Tasks assigned to assessora ADM 
SELECT 'Tasks assigned to assessora ADM:' as test2;
SELECT COUNT(*) as count 
FROM tasks 
WHERE assigned_users @> '["b0dd7f6-55fe-4c28-ac90-368addcb5f9b"]';

-- Test 3: Tasks created by other assessoras ADM
SELECT 'Tasks created by other assessoras ADM:' as test3;
SELECT COUNT(*) as count 
FROM tasks t
JOIN user_profiles up ON t.created_by = up.user_id
WHERE up.role = 'assessora_adm' 
AND t.created_by != 'b0dd7f6-55fe-4c28-ac90-368addcb5f9b';

-- Test 4: Tasks assigned to other assessoras ADM
SELECT 'Tasks assigned to other assessoras ADM:' as test4;
SELECT COUNT(*) as count
FROM tasks t
CROSS JOIN LATERAL unnest(t.assigned_users) AS assigned_user
JOIN user_profiles up ON assigned_user = up.user_id
WHERE up.role = 'assessora_adm' 
AND assigned_user != 'b0dd7f6-55fe-4c28-ac90-368addcb5f9b';

-- Step 7: Show the exact policy logic
SELECT 'POLICY LOGIC CHECK:' as info;
SELECT 'A task should be visible to assessora ADM if:' as logic;
SELECT '1. created_by = current_user' as condition1;
SELECT '2. assigned_users @> [current_user]' as condition2;
SELECT '3. created_by is another assessora ADM' as condition3;
SELECT '4. assigned_users contains another assessora ADM' as condition4;

-- Final summary
SELECT 'EXPECTED RESULT: assessora ADM should see all tasks that match ANY of the above conditions' as summary; 