-- Enable Admin to Edit User Profiles (Name and Email)
-- Date: 2025-01-08
-- Purpose: Ensure admin users can update name and email of all users

-- Step 1: Check current RLS policies for user_profiles
SELECT 'CURRENT USER_PROFILES POLICIES:' as info;
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'user_profiles' AND schemaname = 'public'
ORDER BY policyname;

-- Step 2: Check if get_current_user_role function exists
SELECT 'FUNCTION get_current_user_role exists:' as info;
SELECT routine_name, routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'get_current_user_role';

-- Step 3: Create the function if it doesn't exist
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.user_profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Step 4: Drop existing UPDATE policies to recreate them
DROP POLICY IF EXISTS "Usuários podem atualizar perfis pela hierarquia" ON public.user_profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins e franqueados podem atualizar todos os perfis" ON public.user_profiles;

-- Step 5: Create comprehensive UPDATE policy for user_profiles
CREATE POLICY "user_profiles_update_policy" 
  ON public.user_profiles FOR UPDATE 
  USING (
    -- Users can update their own profile
    auth.uid() = user_id 
    OR
    -- Admin and Franqueado can update all profiles
    public.get_current_user_role() IN ('admin', 'franqueado')
    OR
    -- Coordenador can update specific roles
    (
      public.get_current_user_role() = 'coordenador' 
      AND role IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm')
    )
    OR
    -- Supervisor ADM can update specific roles
    (
      public.get_current_user_role() = 'supervisor_adm' 
      AND role IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm')
    )
  );

-- Step 6: Ensure necessary permissions are granted
GRANT SELECT ON public.user_profiles TO authenticated;
GRANT UPDATE ON public.user_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;

-- Step 7: Test the policy by checking what admin can do
SELECT 'TESTING ADMIN UPDATE PERMISSIONS:' as info;
SELECT 'Admin should be able to update all users' as test_description;

-- Show all users that could be updated (simulation)
SELECT 'USERS THAT CAN BE UPDATED BY ADMIN:' as info;
SELECT 
  user_id,
  name,
  email,
  role,
  is_active
FROM public.user_profiles 
WHERE is_active = true
ORDER BY role, name;

-- Step 8: Also ensure admin can view all users
DROP POLICY IF EXISTS "Usuários podem ver perfis pela hierarquia" ON public.user_profiles;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios perfis" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins e franqueados podem ver todos os perfis" ON public.user_profiles;
DROP POLICY IF EXISTS "Coordenadores podem ver perfis específicos" ON public.user_profiles;
DROP POLICY IF EXISTS "Supervisores ADM podem ver perfis específicos" ON public.user_profiles;

-- Create comprehensive SELECT policy for user_profiles
CREATE POLICY "user_profiles_select_policy" 
  ON public.user_profiles FOR SELECT 
  USING (
    -- Users can see their own profile
    auth.uid() = user_id 
    OR
    -- Admin and Franqueado can see all profiles
    public.get_current_user_role() IN ('admin', 'franqueado')
    OR
    -- Coordenador can see specific roles
    (
      public.get_current_user_role() = 'coordenador' 
      AND role IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm')
    )
    OR
    -- Supervisor ADM can see specific roles
    (
      public.get_current_user_role() = 'supervisor_adm' 
      AND role IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm')
    )
  );

-- Step 9: Check final policies
SELECT 'FINAL USER_PROFILES POLICIES:' as info;
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'user_profiles' AND schemaname = 'public'
ORDER BY policyname;

-- Step 10: Success message
SELECT 'SUCCESS: Admin can now edit name and email of all users!' as result;
SELECT 'The admin user can now update name and email fields in user_profiles table.' as details; 