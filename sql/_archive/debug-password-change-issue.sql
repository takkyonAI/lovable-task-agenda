-- 🔍 DEBUG: Problemas de primeira mudança de senha
-- Data: 2025-01-10
-- Problema: Usuários não conseguem trocar senha no primeiro login

-- 1. Verificar se usuário tem problemas de autenticação
SELECT 
    au.id,
    au.email,
    au.created_at,
    au.email_confirmed_at,
    au.confirmation_sent_at,
    au.last_sign_in_at,
    CASE 
        WHEN au.email_confirmed_at IS NULL THEN 'EMAIL_NAO_CONFIRMADO'
        WHEN au.last_sign_in_at IS NULL THEN 'NUNCA_FEZ_LOGIN'
        ELSE 'AUTENTICADO'
    END as status_auth
FROM auth.users au
WHERE au.email ILIKE '%maria%'
ORDER BY au.created_at DESC;

-- 2. Verificar perfil do usuário
SELECT 
    up.id,
    up.user_id,
    up.name,
    up.email,
    up.role,
    up.is_active,
    up.created_at,
    up.last_login,
    up.first_login_completed,
    CASE 
        WHEN up.first_login_completed = false THEN 'PRECISA_TROCAR_SENHA'
        ELSE 'SENHA_JA_TROCADA'
    END as status_senha
FROM public.user_profiles up
WHERE up.name ILIKE '%maria%'
   OR up.email ILIKE '%maria%'
ORDER BY up.created_at DESC;

-- 3. Verificar se há mismatch entre auth.users e user_profiles
SELECT 
    au.id as auth_id,
    au.email as auth_email,
    up.user_id as profile_user_id,
    up.email as profile_email,
    up.name,
    CASE 
        WHEN au.id = up.user_id THEN 'SINCRONIZADO'
        ELSE 'DESSINCRONIZADO'
    END as status_sync
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id
WHERE au.email ILIKE '%maria%'
   OR up.email ILIKE '%maria%';

-- 4. Verificar políticas RLS que podem estar bloqueando atualizações
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles' AND cmd = 'UPDATE';

-- 5. Testar se usuário consegue atualizar próprio perfil
-- (Execute como o usuário que tem problema)
-- UPDATE public.user_profiles 
-- SET first_login_completed = true 
-- WHERE user_id = auth.uid();

-- 6. Verificar se função get_current_user_role está retornando algo
SELECT 
    auth.uid() as current_user_id,
    public.get_current_user_role() as current_role;

-- 7. Verificar se há triggers que podem estar interferindo
SELECT 
    tgname,
    tgtype,
    tgenabled,
    proname
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'public.user_profiles'::regclass;

-- 8. Forçar confirmação de email se necessário
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW()
-- WHERE email ILIKE '%maria%' AND email_confirmed_at IS NULL;

-- 9. Resetar flag de first_login_completed
-- UPDATE public.user_profiles 
-- SET first_login_completed = false,
--     last_login = NULL
-- WHERE name ILIKE '%maria%' OR email ILIKE '%maria%';

-- 10. Verificar se há problemas com criptografia de senha
SELECT 
    au.id,
    au.email,
    LENGTH(au.encrypted_password) as password_length,
    au.encrypted_password IS NOT NULL as has_password
FROM auth.users au
WHERE au.email ILIKE '%maria%';

-- 11. Verificar se há bloqueios de sessão
SELECT 
    au.id,
    au.email,
    au.is_sso_user,
    au.is_anonymous,
    au.banned_until,
    au.deleted_at
FROM auth.users au
WHERE au.email ILIKE '%maria%';

-- 12. Gerar nova senha temporária manualmente se necessário
-- SELECT crypt('NovaSenh@2025', gen_salt('bf')) as new_encrypted_password;

-- 13. Atualizar senha manualmente no banco se necessário
-- UPDATE auth.users 
-- SET encrypted_password = crypt('NovaSenh@2025', gen_salt('bf')),
--     updated_at = NOW()
-- WHERE email ILIKE '%maria%';

-- ℹ️ INSTRUÇÕES PARA RESOLUÇÃO:
-- 1. Execute queries 1-7 para identificar o problema
-- 2. Se email não confirmado, execute query 8
-- 3. Se first_login_completed = true, execute query 9
-- 4. Se senha corrompida, execute queries 12-13
-- 5. Peça para usuário tentar novamente
-- 6. Verifique logs do console no navegador para erros específicos 