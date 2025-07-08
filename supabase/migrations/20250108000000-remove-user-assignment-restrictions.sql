-- Migration: Remove user assignment restrictions
-- This allows all users to see and assign tasks to any user regardless of role hierarchy
-- Date: 2025-01-08

-- Replace the existing get_visible_users_for_role function to return all active users
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

-- Grant necessary permissions to ensure the function can be called
GRANT EXECUTE ON FUNCTION public.get_visible_users_for_role(TEXT) TO authenticated;

-- Add comment explaining the change
COMMENT ON FUNCTION public.get_visible_users_for_role(TEXT) IS 
'Modified to return all active users regardless of role hierarchy. This allows any user to assign tasks to any other user in the system.'; 