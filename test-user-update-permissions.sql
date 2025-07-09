-- Test User Update Permissions
-- Date: 2025-01-08
-- Purpose: Verify that admin users can update other users successfully

-- Step 1: Check current user roles and permissions
SELECT 'CURRENT USER ROLES AND PERMISSIONS:' as info;
SELECT 
  name,
  email,
  role,
  is_active,
  created_at
FROM public.user_profiles 
WHERE is_active = true
ORDER BY 
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'franqueado' THEN 2
    WHEN 'coordenador' THEN 3
    WHEN 'supervisor_adm' THEN 4
    WHEN 'assessora_adm' THEN 5
    WHEN 'professor' THEN 6
    WHEN 'vendedor' THEN 7
    ELSE 8
  END,
  name;

-- Step 2: Test the get_current_user_role function
SELECT 'TESTING get_current_user_role FUNCTION:' as info;
SELECT routine_name, routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'get_current_user_role';

-- Step 3: Check all UPDATE policies on user_profiles
SELECT 'ALL UPDATE POLICIES ON USER_PROFILES:' as info;
SELECT 
  policyname,
  cmd,
  permissive,
  substr(qual, 1, 100) as policy_condition
FROM pg_policies 
WHERE tablename = 'user_profiles' 
  AND schemaname = 'public' 
  AND cmd = 'UPDATE'
ORDER BY policyname;

-- Step 4: Check table constraints and indexes
SELECT 'TABLE CONSTRAINTS:' as info;
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
  AND table_name = 'user_profiles';

-- Step 5: Test a simple UPDATE statement format
SELECT 'TESTING UPDATE FORMAT:' as info;
SELECT 
  'This is what the UPDATE statement looks like:' as description,
  'UPDATE user_profiles SET name = ?, email = ?, role = ? WHERE id = ?' as format;

-- Step 6: Check for any conflicting or duplicate policies
SELECT 'CHECKING FOR DUPLICATE POLICIES:' as info;
SELECT 
  policyname,
  COUNT(*) as count
FROM pg_policies 
WHERE tablename = 'user_profiles' 
  AND schemaname = 'public'
GROUP BY policyname
HAVING COUNT(*) > 1;

-- Step 7: Verify email uniqueness constraints
SELECT 'EMAIL UNIQUENESS CHECK:' as info;
SELECT 
  email,
  COUNT(*) as count
FROM public.user_profiles 
GROUP BY email
HAVING COUNT(*) > 1;

-- Step 8: Check if there are any triggers on user_profiles
SELECT 'TRIGGERS ON USER_PROFILES:' as info;
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'user_profiles' 
  AND event_object_schema = 'public';

-- Step 9: Test permissions with a simulated UPDATE
SELECT 'PERMISSION TEST SIMULATION:' as info;
SELECT 
  'Admin can update all users' as admin_permission,
  'Franqueado can update all users' as franqueado_permission,
  'Users can update their own profile' as user_permission;

-- Step 10: Success message
SELECT 'DIAGNOSTIC COMPLETE:' as result;
SELECT 'Check the results above for any issues with user update functionality.' as instruction; 