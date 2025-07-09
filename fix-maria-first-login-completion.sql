-- 🔧 CORRIGIR PRIMEIRA TROCA DE SENHA - Maria Thereza Kauss
-- Data: 2025-01-10
-- Problema: Maria fez login mas não consegue completar primeiro login

-- ========================================
-- SITUAÇÃO IDENTIFICADA
-- ========================================

-- ✅ Maria Thereza JÁ CONSEGUIU FAZER LOGIN
-- ✅ Email confirmado: 2025-07-09 22:03:04
-- ✅ Último login: 2025-07-09 22:28
-- ❌ first_login_completed = false (PROBLEMA!)
-- ❌ Diferença de email: Mtkkauss@gmail.com vs mtkkauss@gmail.com

-- ========================================
-- DIAGNÓSTICO ATUAL
-- ========================================

-- 1. Verificar estado atual completo
SELECT 
    'ESTADO_ATUAL' as verificacao,
    au.id,
    au.email as auth_email,
    up.email as profile_email,
    au.email_confirmed_at,
    au.last_sign_in_at,
    up.first_login_completed,
    up.is_active,
    up.role,
    -- Verificar se emails são iguais (case-insensitive)
    LOWER(au.email) = LOWER(up.email) as emails_compativeis,
    -- Tempo desde último login
    EXTRACT(EPOCH FROM (NOW() - au.last_sign_in_at))/3600 as horas_desde_ultimo_login
FROM auth.users au
INNER JOIN public.user_profiles up ON au.id = up.user_id
WHERE au.id = '9549ed2f-c2aa-47fb-ab57-9f481f57bec9';

-- ========================================
-- SOLUÇÕES POSSÍVEIS
-- ========================================

-- OPÇÃO 1: Sincronizar emails (padronizar para minúsculo)
-- UPDATE public.user_profiles 
-- SET email = LOWER(email)
-- WHERE user_id = '9549ed2f-c2aa-47fb-ab57-9f481f57bec9';

-- OPÇÃO 2: Forçar conclusão do primeiro login
-- UPDATE public.user_profiles 
-- SET first_login_completed = true
-- WHERE user_id = '9549ed2f-c2aa-47fb-ab57-9f481f57bec9';

-- OPÇÃO 3: Reset completo para nova tentativa
-- UPDATE public.user_profiles 
-- SET first_login_completed = false,
--     last_login = NULL
-- WHERE user_id = '9549ed2f-c2aa-47fb-ab57-9f481f57bec9';

-- OPÇÃO 4: Definir nova senha temporária
-- UPDATE auth.users 
-- SET encrypted_password = crypt('MariaThereza@2025', gen_salt('bf')),
--     updated_at = NOW()
-- WHERE id = '9549ed2f-c2aa-47fb-ab57-9f481f57bec9';

-- ========================================
-- CORREÇÃO RECOMENDADA
-- ========================================

-- Aplicar correção completa (execute uma por vez):

-- 1. Sincronizar emails
UPDATE public.user_profiles 
SET email = LOWER(email)
WHERE user_id = '9549ed2f-c2aa-47fb-ab57-9f481f57bec9'
  AND email != LOWER(email);

-- 2. Definir nova senha temporária
UPDATE auth.users 
SET encrypted_password = crypt('MariaThereza@2025', gen_salt('bf')),
    updated_at = NOW()
WHERE id = '9549ed2f-c2aa-47fb-ab57-9f481f57bec9';

-- 3. Resetar flag de primeiro login
UPDATE public.user_profiles 
SET first_login_completed = false,
    last_login = NULL
WHERE user_id = '9549ed2f-c2aa-47fb-ab57-9f481f57bec9';

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

-- 4. Verificar se correção foi aplicada
SELECT 
    'VERIFICACAO_FINAL' as tipo,
    au.email as auth_email,
    up.email as profile_email,
    au.email = up.email as emails_sincronizados,
    au.email_confirmed_at IS NOT NULL as email_confirmado,
    LENGTH(au.encrypted_password) > 10 as senha_ok,
    up.first_login_completed,
    up.is_active,
    up.role,
    'mtkkauss@gmail.com' as email_para_login,
    'MariaThereza@2025' as senha_temporaria
FROM auth.users au
INNER JOIN public.user_profiles up ON au.id = up.user_id
WHERE au.id = '9549ed2f-c2aa-47fb-ab57-9f481f57bec9';

-- ========================================
-- TESTE DE LOGIN
-- ========================================

-- 5. Simular condições de login
SELECT 
    'TESTE_LOGIN_FINAL' as tipo,
    au.email,
    CASE 
        WHEN au.email_confirmed_at IS NULL THEN 'FALHA: Email não confirmado'
        WHEN au.banned_until IS NOT NULL THEN 'FALHA: Usuário banido'
        WHEN au.deleted_at IS NOT NULL THEN 'FALHA: Usuário deletado'
        WHEN au.encrypted_password IS NULL THEN 'FALHA: Sem senha'
        WHEN LENGTH(au.encrypted_password) < 10 THEN 'FALHA: Senha corrompida'
        WHEN up.is_active = false THEN 'FALHA: Perfil inativo'
        ELSE 'SUCESSO: Login deveria funcionar'
    END as resultado_login,
    CASE 
        WHEN up.first_login_completed = false THEN 'REDIRECIONAMENTO: Primeira troca de senha'
        ELSE 'ACESSO: Direto ao sistema'
    END as comportamento_esperado
FROM auth.users au
INNER JOIN public.user_profiles up ON au.id = up.user_id
WHERE au.id = '9549ed2f-c2aa-47fb-ab57-9f481f57bec9';

-- ℹ️ INSTRUÇÕES:
-- 1. Execute query 1 para ver estado atual
-- 2. Execute correções 1, 2, 3 (uma por vez)
-- 3. Execute verificação final (query 4)
-- 4. Execute teste de login (query 5)
-- 5. Teste login no sistema: mtkkauss@gmail.com / MariaThereza@2025

-- 📝 CREDENCIAIS CORRIGIDAS:
-- Email: mtkkauss@gmail.com (tudo minúsculo)
-- Senha: MariaThereza@2025
-- Esperado: Login + redirecionamento para primeira troca de senha 