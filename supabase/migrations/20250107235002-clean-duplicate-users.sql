-- Migration: Clean duplicate users and check current state
-- This will help identify and clean up any problematic user records

-- First, let's see what users exist
-- SELECT email, COUNT(*) as count FROM auth.users GROUP BY email HAVING COUNT(*) > 1;

-- Check for orphaned auth users without profiles
-- SELECT au.email, au.id as auth_id 
-- FROM auth.users au 
-- LEFT JOIN public.user_profiles up ON au.id = up.user_id 
-- WHERE up.user_id IS NULL;

-- Delete orphaned auth users (users without profiles that failed during creation)
DELETE FROM auth.users 
WHERE id IN (
  SELECT au.id 
  FROM auth.users au 
  LEFT JOIN public.user_profiles up ON au.id = up.user_id 
  WHERE up.user_id IS NULL 
  AND au.email NOT IN ('wadevenga@hotmail.com') -- Protect admin user
  AND au.created_at > (NOW() - INTERVAL '1 hour') -- Only recent failed attempts
);

-- Also clean up any profiles without corresponding auth users
DELETE FROM public.user_profiles 
WHERE user_id NOT IN (
  SELECT id FROM auth.users
);

-- Show current state
-- SELECT 'Auth Users' as table_name, COUNT(*) as count FROM auth.users
-- UNION ALL
-- SELECT 'User Profiles' as table_name, COUNT(*) as count FROM public.user_profiles; 