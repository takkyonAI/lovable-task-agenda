-- INVESTIGATE ASSESSORA ADM ISSUE - DETAILED ANALYSIS
-- Date: 2025-01-08
-- Goal: Understand why assessora ADM still sees only 2 tasks

-- Step 1: Check how many assessora ADM users exist
SELECT 'STEP 1: All assessora ADM users' as step;
SELECT 
    user_id,
    name,
    email,
    role,
    is_active,
    created_at
FROM public.user_profiles 
WHERE role = 'assessora_adm'
ORDER BY created_at;

-- Step 2: Check ALL tasks in the system
SELECT 'STEP 2: All tasks in system' as step;
SELECT 
    t.id,
    t.title,
    t.status,
    t.priority,
    t.created_by,
    up.name as creator_name,
    up.role as creator_role,
    up.is_active as creator_active,
    t.created_at
FROM public.tasks t
LEFT JOIN public.user_profiles up ON t.created_by = up.user_id
ORDER BY t.created_at DESC;

-- Step 3: Count tasks by role
SELECT 'STEP 3: Tasks count by creator role' as step;
SELECT 
    up.role,
    COUNT(t.id) as task_count
FROM public.tasks t
LEFT JOIN public.user_profiles up ON t.created_by = up.user_id
GROUP BY up.role
ORDER BY task_count DESC;

-- Step 4: Check specifically tasks created by assessora ADM
SELECT 'STEP 4: Tasks created by assessora ADM' as step;
SELECT 
    t.id,
    t.title,
    t.status,
    t.created_by,
    up.name as creator_name,
    up.is_active as creator_active,
    t.created_at
FROM public.tasks t
JOIN public.user_profiles up ON t.created_by = up.user_id
WHERE up.role = 'assessora_adm'
ORDER BY t.created_at DESC;

-- Step 5: Check current RLS policies
SELECT 'STEP 5: Current RLS policies' as step;
SELECT 
    policyname,
    cmd,
    permissive,
    qual
FROM pg_policies 
WHERE tablename = 'tasks' AND schemaname = 'public'
ORDER BY policyname;

-- Step 6: Check if RLS is enabled
SELECT 'STEP 6: RLS status' as step;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'tasks' AND schemaname = 'public';

-- Step 7: Test policy manually (this won't work in SQL editor but shows the logic)
SELECT 'STEP 7: Policy test logic' as step;
SELECT 'If there are multiple assessora ADM users and multiple tasks created by them, but current user sees only 2, then policy is still not working' as analysis;

-- Step 8: Show what the fix should be
SELECT 'STEP 8: Expected behavior' as step;
SELECT 'Assessora ADM should see ALL tasks created by ANY assessora ADM user' as expected_behavior;
SELECT 'Current behavior: Assessora ADM sees only their own tasks (2 tasks)' as current_behavior;

-- Step 9: Diagnosis
SELECT 'STEP 9: Diagnosis' as step;
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM public.user_profiles WHERE role = 'assessora_adm') > 1 
        AND (SELECT COUNT(*) FROM public.tasks t JOIN public.user_profiles up ON t.created_by = up.user_id WHERE up.role = 'assessora_adm') > 2
        THEN 'PROBLEM: Multiple assessoras and tasks exist, but policy is not working'
        WHEN (SELECT COUNT(*) FROM public.user_profiles WHERE role = 'assessora_adm') = 1
        THEN 'INFO: Only 1 assessora ADM exists, so seeing only own tasks is correct'
        ELSE 'INFO: Need to check task distribution'
    END as diagnosis; 