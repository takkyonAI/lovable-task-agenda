-- Verificar se a função get_current_user_role existe e está funcionando (CORRIGIDO)
-- Execute este script no Query Editor do Supabase

-- 1. Verificar se a função get_current_user_role existe
SELECT 
    'FUNCTION get_current_user_role:' as info,
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE p.proname = 'get_current_user_role'
            AND n.nspname = 'public'
        ) THEN 'EXISTS'
        ELSE 'NOT EXISTS'
    END as status;

-- 2. Se a função existe, mostrar sua definição
SELECT 
    'FUNCTION DEFINITION:' as info,
    p.proname as function_name,
    p.prosrc as function_source
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_current_user_role'
AND n.nspname = 'public';

-- 3. Verificar se auth.uid() está funcionando
SELECT 
    'CURRENT USER:' as info,
    auth.uid() as current_user_id,
    auth.email() as current_user_email;

-- 4. Verificar se há um perfil para o usuário atual
SELECT 
    'CURRENT USER PROFILE:' as info,
    up.name,
    up.email,
    up.role
FROM public.user_profiles up
WHERE up.user_id = auth.uid();

-- 5. Verificar se há alguma policy que pode estar bloqueando o update (CORRIGIDO)
SELECT 
    'RLS POLICIES CHECK:' as info,
    p.polname as policy_name,
    p.polcmd as command,
    p.polpermissive as permissive,
    p.polqual as qual,
    p.polwithcheck as with_check
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'user_profiles'
AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND p.polcmd = 'u'; -- 'u' para UPDATE

-- 6. Verificar se RLS está habilitado na tabela
SELECT 
    'RLS STATUS:' as info,
    c.relname as table_name,
    c.relrowsecurity as rls_enabled
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'user_profiles'
AND n.nspname = 'public';

-- 7. Listar alguns usuários para teste
SELECT 
    'USERS FOR TESTING:' as info,
    id,
    name,
    email,
    role
FROM public.user_profiles
ORDER BY created_at DESC
LIMIT 3; 