-- 🔍 DIAGNÓSTICO REAL: Maria Thereza Kauss
-- Data: 2025-01-10
-- Problema: Usuária EXISTE em ambas tabelas mas não consegue trocar senha

-- ========================================
-- PARTE 1: VERIFICAR EXISTÊNCIA COMPLETA
-- ========================================

-- 1. Verificar na auth.users com email exato
SELECT 
    'AUTH_USERS' as tabela,
    au.id,
    au.email,
    au.created_at,
    au.email_confirmed_at,
    au.confirmation_sent_at,
    au.last_sign_in_at,
    au.banned_until,
    au.deleted_at,
    LENGTH(au.encrypted_password) as password_length,
    au.raw_user_meta_data->>'full_name' as full_name,
    CASE 
        WHEN au.email_confirmed_at IS NULL THEN 'EMAIL_NAO_CONFIRMADO'
        WHEN au.banned_until IS NOT NULL THEN 'BANIDO'
        WHEN au.deleted_at IS NOT NULL THEN 'DELETADO'
        WHEN au.last_sign_in_at IS NULL THEN 'NUNCA_FEZ_LOGIN'
        ELSE 'OK'
    END as status_auth
FROM auth.users au
WHERE au.id = '9549ed2f-c2aa-47fb-ab57-9f491f57bec9';

-- 2. Verificar no user_profiles
SELECT 
    'USER_PROFILES' as tabela,
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
        WHEN up.is_active = false THEN 'INATIVO'
        WHEN up.first_login_completed = false THEN 'PRECISA_TROCAR_SENHA'
        ELSE 'OK'
    END as status_profile
FROM public.user_profiles up
WHERE up.user_id = '9549ed2f-c2aa-47fb-ab57-9f491f57bec9';

-- ========================================
-- PARTE 2: VERIFICAR PROBLEMAS ESPECÍFICOS
-- ========================================

-- 3. Verificar se emails são exatamente iguais
SELECT 
    'COMPARACAO_EMAILS' as tipo,
    au.email as auth_email,
    up.email as profile_email,
    au.email = up.email as emails_identicos,
    LENGTH(au.email) as auth_email_length,
    LENGTH(up.email) as profile_email_length,
    ascii(substr(au.email, 1, 1)) as auth_primeiro_char,
    ascii(substr(up.email, 1, 1)) as profile_primeiro_char
FROM auth.users au
INNER JOIN public.user_profiles up ON au.id = up.user_id
WHERE au.id = '9549ed2f-c2aa-47fb-ab57-9f491f57bec9';

-- 4. Verificar se senha está válida
SELECT 
    'SENHA_STATUS' as tipo,
    au.id,
    au.email,
    au.encrypted_password IS NOT NULL as tem_senha,
    LENGTH(au.encrypted_password) as tamanho_senha_hash,
    au.encrypted_password LIKE '$2%' as formato_bcrypt_correto,
    au.email_confirmed_at IS NOT NULL as email_confirmado
FROM auth.users au
WHERE au.id = '9549ed2f-c2aa-47fb-ab57-9f491f57bec9';

-- 5. Testar se consegue fazer login simulado
-- (Esta query simula uma tentativa de login)
SELECT 
    'TESTE_LOGIN' as tipo,
    au.id,
    au.email,
    CASE 
        WHEN au.email_confirmed_at IS NULL THEN 'FALHA: Email não confirmado'
        WHEN au.banned_until IS NOT NULL THEN 'FALHA: Usuário banido'
        WHEN au.deleted_at IS NOT NULL THEN 'FALHA: Usuário deletado'
        WHEN au.encrypted_password IS NULL THEN 'FALHA: Sem senha'
        WHEN LENGTH(au.encrypted_password) < 10 THEN 'FALHA: Senha corrompida'
        ELSE 'OK: Deveria conseguir fazer login'
    END as resultado_teste
FROM auth.users au
WHERE au.id = '9549ed2f-c2aa-47fb-ab57-9f491f57bec9';

-- ========================================
-- PARTE 3: VERIFICAR POLÍTICAS RLS
-- ========================================

-- 6. Verificar se pode atualizar o próprio perfil
-- (Simular permissão de UPDATE)
SELECT 
    'RLS_UPDATE_TEST' as tipo,
    pol.policyname,
    pol.cmd,
    pol.qual,
    pol.with_check
FROM pg_policies pol
WHERE pol.tablename = 'user_profiles' 
  AND pol.cmd = 'UPDATE';

-- ========================================
-- PARTE 4: SOLUÇÕES POTENCIAIS
-- ========================================

-- 7. Se email não confirmado, confirmar
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW()
-- WHERE id = '9549ed2f-c2aa-47fb-ab57-9f491f57bec9' 
--   AND email_confirmed_at IS NULL;

-- 8. Se senha corrompida, definir nova
-- UPDATE auth.users 
-- SET encrypted_password = crypt('MariaThereza@2025', gen_salt('bf')),
--     updated_at = NOW()
-- WHERE id = '9549ed2f-c2aa-47fb-ab57-9f491f57bec9';

-- 9. Forçar first_login_completed = false
-- UPDATE public.user_profiles 
-- SET first_login_completed = false,
--     last_login = NULL
-- WHERE user_id = '9549ed2f-c2aa-47fb-ab57-9f491f57bec9';

-- 10. Verificação final após correções
-- SELECT 
--     'FINAL_CHECK' as tipo,
--     au.email,
--     au.email_confirmed_at IS NOT NULL as email_ok,
--     au.encrypted_password IS NOT NULL as senha_ok,
--     up.first_login_completed as precisa_trocar_senha,
--     up.is_active as perfil_ativo
-- FROM auth.users au
-- INNER JOIN public.user_profiles up ON au.id = up.user_id
-- WHERE au.id = '9549ed2f-c2aa-47fb-ab57-9f491f57bec9';

-- ℹ️ INSTRUÇÕES:
-- 1. Execute queries 1-6 para identificar problema específico
-- 2. Com base nos resultados, execute correção apropriada (7, 8 ou 9)
-- 3. Execute query 10 para verificar se foi corrigido
-- 4. Teste login da Maria Thereza 