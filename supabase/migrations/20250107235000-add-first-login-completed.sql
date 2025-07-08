-- Migration: Add first_login_completed field to user_profiles table
-- This field will track whether users have completed their first login and changed their temporary password

-- Add first_login_completed column
ALTER TABLE public.user_profiles 
ADD COLUMN first_login_completed BOOLEAN DEFAULT false NOT NULL;

-- Update existing users to true (they have already logged in)
UPDATE public.user_profiles 
SET first_login_completed = true 
WHERE last_login IS NOT NULL;

-- Add comment to the column
COMMENT ON COLUMN public.user_profiles.first_login_completed IS 'Tracks whether user has completed their first login and changed temporary password';

-- Create index for performance
CREATE INDEX idx_user_profiles_first_login_completed 
ON public.user_profiles (first_login_completed);

-- Grant appropriate permissions
GRANT SELECT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon; 