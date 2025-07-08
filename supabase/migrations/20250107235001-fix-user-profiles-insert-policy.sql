-- Migration: Fix user_profiles insert policy to allow admins to create profiles for other users
-- This will allow admins and franqueados to create user profiles during user creation

-- Remove the restrictive insert policy
DROP POLICY IF EXISTS "Usuários pueden crear su propio perfil" ON public.user_profiles;

-- Create a new policy that allows:
-- 1. Users to create their own profiles
-- 2. Admins and franqueados to create profiles for other users
CREATE POLICY "Usuários e admins podem criar perfis" 
  ON public.user_profiles FOR INSERT 
  WITH CHECK (
    -- Users can create their own profile
    auth.uid() = user_id OR
    -- Admins and franqueados can create profiles for others
    EXISTS (
      SELECT 1 FROM public.user_profiles up1
      WHERE up1.user_id = auth.uid() AND up1.role IN ('admin', 'franqueado')
    )
  );

-- Grant necessary permissions
GRANT INSERT ON public.user_profiles TO authenticated; 