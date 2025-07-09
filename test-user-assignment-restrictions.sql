-- Test and Fix User Assignment Restrictions
-- This script will test and apply the migration to remove user assignment restrictions
-- Date: 2025-01-08

-- Step 1: Check if the migration function was applied
SELECT 
    routine_name, 
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'get_visible_users_for_role';

-- Step 2: Test current function behavior (if it exists)
-- This will show what users are returned for different roles

-- Test for admin role
SELECT 'Admin role test:' as test_type;
SELECT user_id, name, email, role 
FROM public.get_visible_users_for_role('admin');

-- Test for vendedor role
SELECT 'Vendedor role test:' as test_type;
SELECT user_id, name, email, role 
FROM public.get_visible_users_for_role('vendedor');

-- Test for professor role
SELECT 'Professor role test:' as test_type;
SELECT user_id, name, email, role 
FROM public.get_visible_users_for_role('professor');

-- Step 3: Check what users exist in the system
SELECT 'All users in system:' as info;
SELECT user_id, name, email, role, is_active 
FROM public.user_profiles 
ORDER BY role, name;

-- Step 4: Apply the migration if needed
-- Replace the function to return all active users regardless of role

CREATE OR REPLACE FUNCTION public.get_visible_users_for_role(user_role TEXT)
RETURNS TABLE(user_id UUID, name TEXT, email TEXT, role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return all active users regardless of the current user's role
  -- This allows any user to assign tasks to any other user
  RETURN QUERY 
  SELECT up.user_id, up.name, up.email, up.role
  FROM public.user_profiles up 
  WHERE up.is_active = true
  ORDER BY up.name;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_visible_users_for_role(TEXT) TO authenticated;

-- Add comment explaining the change
COMMENT ON FUNCTION public.get_visible_users_for_role(TEXT) IS 
'Modified to return all active users regardless of role hierarchy. This allows any user to assign tasks to any other user in the system.';

-- Step 5: Test the updated function
SELECT 'After migration - Admin role test:' as test_type;
SELECT user_id, name, email, role 
FROM public.get_visible_users_for_role('admin');

SELECT 'After migration - Vendedor role test:' as test_type;
SELECT user_id, name, email, role 
FROM public.get_visible_users_for_role('vendedor');

SELECT 'After migration - Professor role test:' as test_type;
SELECT user_id, name, email, role 
FROM public.get_visible_users_for_role('professor');

-- Step 6: Success message
SELECT 'Migration applied successfully! All users can now assign tasks to any other user.' as result; 