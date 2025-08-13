-- 🔍 DEBUG: Investigar problema da usuária Maria Thereza Kauss
-- Data: 2025-01-10
-- Problema: Usuária não consegue cadastrar senha nova após receber email temporário

-- 1. Verificar se a usuária existe no sistema
SELECT 
    up.id,
    up.user_id,
    up.name,
    up.email,
    up.role,
    up.is_active,
    up.created_at,
    up.last_login,
    up.first_login_completed
FROM public.user_profiles up
WHERE up.name ILIKE '%maria%thereza%kauss%' 
   OR up.email ILIKE '%maria%thereza%kauss%'
   OR up.email ILIKE '%mariatkauss%';

-- 2. Verificar se existe no auth.users
SELECT 
    au.id,
    au.email,
    au.created_at,
    au.email_confirmed_at,
    au.confirmation_sent_at,
    au.recovery_sent_at,
    au.email_change_sent_at,
    au.last_sign_in_at,
    au.raw_user_meta_data->>'full_name' as full_name
FROM auth.users au
WHERE au.email ILIKE '%maria%thereza%kauss%'
   OR au.email ILIKE '%mariatkauss%'
   OR au.raw_user_meta_data->>'full_name' ILIKE '%maria%thereza%kauss%';

-- 3. Verificar políticas RLS que podem estar bloqueando
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 4. Verificar se há logs de reset de senha
SELECT 
    prl.user_id,
    prl.email,
    prl.reset_at,
    prl.reset_method,
    up.name
FROM public.password_reset_log prl
LEFT JOIN public.user_profiles up ON prl.user_id = up.user_id
WHERE prl.email ILIKE '%maria%thereza%kauss%'
   OR prl.email ILIKE '%mariatkauss%'
ORDER BY prl.reset_at DESC;

-- 5. Verificar se há erros de função
SELECT 
    function_name,
    error_message,
    created_at
FROM public.function_errors
WHERE function_name = 'reset_user_password'
ORDER BY created_at DESC
LIMIT 5;

-- 6. Testar se a função RPC está funcionando corretamente
-- (Substituir 'email_da_maria' pelo email correto quando encontrado)
-- SELECT public.reset_user_password('email_da_maria', 'NovaSenh@2025');

-- 7. Verificar se há problemas de email confirmation
-- Para usuarios que não conseguem fazer login, pode ser problema de email não confirmado
SELECT 
    au.id,
    au.email,
    au.email_confirmed_at,
    au.confirmation_sent_at,
    CASE 
        WHEN au.email_confirmed_at IS NULL THEN 'EMAIL_NAO_CONFIRMADO'
        ELSE 'EMAIL_CONFIRMADO'
    END as status_email
FROM auth.users au
WHERE au.email ILIKE '%maria%thereza%kauss%'
   OR au.email ILIKE '%mariatkauss%';

-- 8. Verificar se há duplicatas ou conflitos
SELECT 
    email,
    COUNT(*) as total_registros
FROM public.user_profiles
GROUP BY email
HAVING COUNT(*) > 1;

-- 9. Verificar se a função get_current_user_role está funcionando
SELECT public.get_current_user_role();

-- 10. Solução potencial - Forçar confirmação de email se necessário
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW()
-- WHERE email ILIKE '%maria%thereza%kauss%' 
--    OR email ILIKE '%mariatkauss%';

-- 11. Solução potencial - Forçar first_login_completed = false
-- UPDATE public.user_profiles 
-- SET first_login_completed = false,
--     last_login = NULL
-- WHERE name ILIKE '%maria%thereza%kauss%' 
--    OR email ILIKE '%maria%thereza%kauss%';

-- ℹ️ INSTRUÇÕES PARA RESOLUÇÃO:
-- 1. Execute as queries 1-9 primeiro para identificar o problema
-- 2. Se email não estiver confirmado, execute query 10
-- 3. Se first_login_completed estiver como true, execute query 11
-- 4. Teste o login da usuária novamente
-- 5. Se ainda não funcionar, verifique os logs do console no navegador 