-- Verificar se a função get_current_user_role existe e está funcionando
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

-- 3. Criar a função se ela não existir
-- (Descomente apenas se o script acima mostrar que a função não existe)
/*
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM public.user_profiles 
        WHERE user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/

-- 4. Testar a função se ela existir
-- (Descomente apenas se você tiver certeza de que a função existe)
-- SELECT 'TESTING FUNCTION:' as info, get_current_user_role() as current_role;

-- 5. Verificar se auth.uid() está funcionando
SELECT 
    'CURRENT USER:' as info,
    auth.uid() as current_user_id,
    auth.email() as current_user_email;

-- 6. Verificar se há um perfil para o usuário atual
SELECT 
    'CURRENT USER PROFILE:' as info,
    up.name,
    up.email,
    up.role
FROM public.user_profiles up
WHERE up.user_id = auth.uid();

-- 7. Verificar todas as funções que usam auth.uid()
SELECT 
    'FUNCTIONS USING auth.uid():' as info,
    p.proname as function_name,
    p.prosrc as function_source
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prosrc ILIKE '%auth.uid()%';

-- 8. Verificar se há alguma policy que pode estar bloqueando o update
SELECT 
    'RLS POLICIES CHECK:' as info,
    p.policyname,
    p.cmd,
    p.permissive,
    p.qual,
    p.with_check
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'user_profiles'
AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND p.cmd = 'UPDATE'; 