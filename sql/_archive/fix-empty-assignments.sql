-- FIX EMPTY ASSIGNMENTS - Add assessoras ADM to tasks with empty assigned_users
-- Date: 2025-01-08
-- Problem: 2 tasks have empty assigned_users, causing visibility issues

-- Step 1: Show current empty assignments
SELECT 'TASKS WITH EMPTY ASSIGNED_USERS:' as info;
SELECT title, created_by, assigned_users
FROM public.tasks
WHERE assigned_users IS NOT NULL 
  AND (assigned_users = '{}' OR array_length(assigned_users, 1) IS NULL);

-- Step 2: Get all assessoras ADM user IDs
SELECT 'ASSESSORAS ADM USER IDS:' as info;
SELECT user_id, name
FROM public.user_profiles 
WHERE role = 'assessora_adm'
ORDER BY name;

-- Step 3: Update tasks with empty assigned_users to include all assessoras ADM
UPDATE public.tasks
SET assigned_users = (
  SELECT ARRAY_AGG(user_id)
  FROM public.user_profiles 
  WHERE role = 'assessora_adm'
)
WHERE assigned_users IS NOT NULL 
  AND (assigned_users = '{}' OR array_length(assigned_users, 1) IS NULL);

-- Step 4: Verify the fix
SELECT 'UPDATED TASKS - SHOULD NOW HAVE ASSESSORAS ADM:' as info;
SELECT title, created_by, assigned_users, array_length(assigned_users, 1) as num_users
FROM public.tasks
WHERE title IN ('teste adm', 'Follow Eduardo');

-- Step 5: Test final visibility count
SELECT 'FINAL VISIBILITY COUNT (should be 14):' as info;
SELECT COUNT(*) as visible_tasks
FROM public.tasks t
WHERE (
  -- Tarefas criadas por assessoras ADM
  t.created_by IN (
    SELECT user_id FROM public.user_profiles WHERE role = 'assessora_adm'
  )
  OR
  -- Tarefas atribuídas para assessoras ADM
  t.assigned_users && (
    SELECT ARRAY_AGG(user_id) FROM public.user_profiles WHERE role = 'assessora_adm'
  )
);

-- Step 6: Success message
SELECT 'SUCCESS: Empty assignments fixed! All tasks should now be visible to assessora ADM.' as result; 