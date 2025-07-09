-- Migration: Add RPC function for password reset
-- This function allows the application to reset user passwords for the "forgot password" feature

-- Create RPC function to reset user password
CREATE OR REPLACE FUNCTION public.reset_user_password(
  user_email TEXT,
  new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id UUID;
  encrypted_password TEXT;
BEGIN
  -- Input validation
  IF user_email IS NULL OR user_email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;
  
  IF new_password IS NULL OR new_password = '' THEN
    RAISE EXCEPTION 'New password is required';
  END IF;
  
  -- Check if user exists in user_profiles
  SELECT up.user_id INTO user_id
  FROM public.user_profiles up
  WHERE up.email = user_email;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Encrypt the new password using crypt function
  encrypted_password := crypt(new_password, gen_salt('bf'));
  
  -- Update password in auth.users table
  UPDATE auth.users 
  SET 
    encrypted_password = encrypted_password,
    updated_at = NOW()
  WHERE id = user_id;
  
  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to update password';
  END IF;
  
  -- Log the password reset for security audit
  INSERT INTO public.password_reset_log (
    user_id,
    email,
    reset_at,
    reset_method
  ) VALUES (
    user_id,
    user_email,
    NOW(),
    'forgot_password'
  );
  
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error for debugging
    INSERT INTO public.function_errors (
      function_name,
      error_message,
      created_at
    ) VALUES (
      'reset_user_password',
      SQLERRM,
      NOW()
    );
    
    RETURN FALSE;
END;
$$;

-- Create audit table for password resets
CREATE TABLE IF NOT EXISTS public.password_reset_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  reset_method TEXT NOT NULL DEFAULT 'forgot_password',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create error logging table
CREATE TABLE IF NOT EXISTS public.function_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  error_message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on audit tables
ALTER TABLE public.password_reset_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.function_errors ENABLE ROW LEVEL SECURITY;

-- Create policies for audit tables (admin only)
CREATE POLICY "Only admin can view password reset logs"
  ON public.password_reset_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'franqueado')
    )
  );

CREATE POLICY "Only admin can view function errors"
  ON public.function_errors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'franqueado')
    )
  );

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.reset_user_password(TEXT, TEXT) TO authenticated;

-- Add comment to the function
COMMENT ON FUNCTION public.reset_user_password(TEXT, TEXT) IS 'Resets user password for forgot password feature. Requires user email and new password.';

-- Test the function (optional - remove in production)
-- SELECT public.reset_user_password('test@example.com', 'new_temp_password_123');

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_password_reset_log_user_id ON public.password_reset_log(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_log_reset_at ON public.password_reset_log(reset_at);
CREATE INDEX IF NOT EXISTS idx_function_errors_created_at ON public.function_errors(created_at); 