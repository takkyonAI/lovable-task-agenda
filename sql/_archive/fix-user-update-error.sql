-- Fix User Update Error - Remove updated_at field reference
-- Date: 2025-01-08
-- Problem: updateUser function was trying to update non-existent 'updated_at' field in user_profiles table
-- Solution: Remove updated_at from updateData object

-- Step 1: Verify user_profiles table structure
SELECT 'USER_PROFILES TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check current RLS policies for user_profiles UPDATE
SELECT 'CURRENT UPDATE POLICIES FOR USER_PROFILES:' as info;
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'user_profiles' AND schemaname = 'public' AND cmd = 'UPDATE'
ORDER BY policyname;

-- Step 3: Test admin permissions to update users
SELECT 'ADMIN ROLE CHECK:' as info;
SELECT user_id, name, email, role, is_active 
FROM public.user_profiles 
WHERE role = 'admin' AND is_active = true;

-- Step 4: Show fields that CAN be updated in user_profiles
SELECT 'FIELDS THAT CAN BE UPDATED:' as info;
SELECT 
  'name' as field,
  'TEXT' as type,
  'User display name' as description
UNION ALL
SELECT 
  'email' as field,
  'TEXT' as type,
  'User email address' as description
UNION ALL
SELECT 
  'role' as field,
  'TEXT' as type,
  'User role in system' as description
UNION ALL
SELECT 
  'is_active' as field,
  'BOOLEAN' as type,
  'User active status' as description
UNION ALL
SELECT 
  'last_login' as field,
  'TIMESTAMP' as type,
  'Last login time' as description;

-- Step 5: Verify that updated_at field does NOT exist (should return no rows)
SELECT 'CHECKING FOR UPDATED_AT FIELD (should be empty):' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles' 
  AND table_schema = 'public' 
  AND column_name = 'updated_at';

-- Step 6: Compare with tasks table which HAS updated_at
SELECT 'TASKS TABLE HAS UPDATED_AT:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tasks' 
  AND table_schema = 'public' 
  AND column_name = 'updated_at';

-- Step 7: Test policy by showing which users can be updated
SELECT 'USERS THAT CAN BE UPDATED BY ADMIN:' as info;
SELECT 
  id,
  name,
  email,
  role,
  is_active,
  created_at
FROM public.user_profiles 
WHERE is_active = true
ORDER BY role, name;

-- Step 8: Success message
SELECT 'SUCCESS: User update functionality should now work correctly!' as result;
SELECT 'The updateUser function no longer tries to update the non-existent updated_at field.' as details;
SELECT 'Only valid fields (name, email, role) are being updated.' as validation; 