-- DEBUG: Check current state after fix
-- Date: 2025-01-08

-- Step 1: Check if policies were created correctly
SELECT 'CURRENT RLS POLICIES:' as info;
SELECT policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'tasks' AND schemaname = 'public'
ORDER BY policyname;

-- Step 2: Check how many assessoras ADM exist
SELECT 'ASSESSORAS ADM COUNT:' as info;
SELECT COUNT(*) as total_assessoras_adm
FROM public.user_profiles 
WHERE role = 'assessora_adm';

-- Step 3: Show all assessoras ADM
SELECT 'ALL ASSESSORAS ADM:' as info;
SELECT user_id, full_name, email, role
FROM public.user_profiles 
WHERE role = 'assessora_adm';

-- Step 4: Check total tasks in database
SELECT 'TOTAL TASKS IN DATABASE:' as info;
SELECT COUNT(*) as total_tasks
FROM public.tasks;

-- Step 5: Check tasks by creator role
SELECT 'TASKS BY CREATOR ROLE:' as info;
SELECT up.role as creator_role, COUNT(*) as task_count
FROM public.tasks t
JOIN public.user_profiles up ON t.created_by = up.user_id
GROUP BY up.role
ORDER BY task_count DESC;

-- Step 6: Check tasks created by assessoras ADM
SELECT 'TASKS CREATED BY ASSESSORAS ADM:' as info;
SELECT t.id, t.title, t.created_by, up.full_name as creator_name
FROM public.tasks t
JOIN public.user_profiles up ON t.created_by = up.user_id
WHERE up.role = 'assessora_adm'
ORDER BY t.created_at DESC;

-- Step 7: Check tasks assigned to assessoras ADM
SELECT 'TASKS ASSIGNED TO ASSESSORAS ADM:' as info;
SELECT t.id, t.title, t.assigned_users, 
       up_creator.full_name as creator_name,
       up_creator.role as creator_role
FROM public.tasks t
JOIN public.user_profiles up_creator ON t.created_by = up_creator.user_id
WHERE EXISTS (
    SELECT 1 
    FROM public.user_profiles up_assigned 
    WHERE up_assigned.role = 'assessora_adm' 
    AND up_assigned.user_id = ANY(t.assigned_users)
)
ORDER BY t.created_at DESC;

-- Step 8: Check what current user (tatiana) should see
SELECT 'WHAT TATIANA SHOULD SEE (simulation):' as info;

-- Simulate current user context
WITH current_user_context AS (
    SELECT user_id, role, full_name
    FROM public.user_profiles 
    WHERE email = 'tatianabeiroroadvodaga@gmail.com'
)
SELECT 'Own tasks:' as category, COUNT(*) as count
FROM public.tasks t, current_user_context cuc
WHERE t.created_by = cuc.user_id

UNION ALL

SELECT 'Tasks assigned to me:' as category, COUNT(*) as count
FROM public.tasks t, current_user_context cuc
WHERE cuc.user_id = ANY(t.assigned_users)

UNION ALL

SELECT 'Tasks created by other assessoras ADM:' as category, COUNT(*) as count
FROM public.tasks t, current_user_context cuc
JOIN public.user_profiles up ON t.created_by = up.user_id
WHERE cuc.role = 'assessora_adm'
AND up.role = 'assessora_adm'
AND t.created_by != cuc.user_id

UNION ALL

SELECT 'Tasks assigned to other assessoras ADM:' as category, COUNT(*) as count
FROM public.tasks t, current_user_context cuc
WHERE cuc.role = 'assessora_adm'
AND EXISTS (
    SELECT 1 
    FROM public.user_profiles up 
    WHERE up.role = 'assessora_adm' 
    AND up.user_id = ANY(t.assigned_users)
    AND up.user_id != cuc.user_id
);

-- Step 9: Success message
SELECT 'DEBUG COMPLETE - Check results above' as result; 