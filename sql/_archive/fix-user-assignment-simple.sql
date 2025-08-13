-- Fix User Assignment Restrictions - Simple Version
-- This script creates the function and removes user assignment restrictions
-- Date: 2025-01-08

-- Step 1: Check what users exist in the system
SELECT 'All users in system:' as info;
SELECT user_id, name, email, role, is_active 
FROM public.user_profiles 
ORDER BY role, name;

-- Step 2: Create the function to return all active users regardless of role
-- This removes the role-based filtering that was preventing users from assigning tasks to others
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

-- Step 3: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_visible_users_for_role(TEXT) TO authenticated;

-- Step 4: Add comment explaining the change
COMMENT ON FUNCTION public.get_visible_users_for_role(TEXT) IS 
'Returns all active users regardless of role hierarchy. This allows any user to assign tasks to any other user in the system.';

-- Step 5: Test the function with different roles
SELECT 'Function created successfully! Testing with admin role:' as test_type;
SELECT user_id, name, email, role 
FROM public.get_visible_users_for_role('admin');

SELECT 'Testing with vendedor role:' as test_type;
SELECT user_id, name, email, role 
FROM public.get_visible_users_for_role('vendedor');

SELECT 'Testing with professor role:' as test_type;
SELECT user_id, name, email, role 
FROM public.get_visible_users_for_role('professor');

-- Step 6: Success message
SELECT 'SUCCESS: Function created and tested! All users can now assign tasks to any other user.' as result;
SELECT 'Next: Test in the application to confirm the fix works.' as next_step; 