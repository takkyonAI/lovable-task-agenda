-- 🔍 INTERPRETAR RESULTADO "SUCESSO" - Maria Thereza Kauss
-- Data: 2025-01-10
-- Resultado do diagnóstico: "sucesso"

-- ========================================
-- VERIFICAR O QUE "SUCESSO" SIGNIFICA
-- ========================================

-- 1. Verificar status atual completo
SELECT 
    'STATUS_ATUAL' as verificacao,
    au.id,
    au.email,
    au.email_confirmed_at IS NOT NULL as email_confirmado,
    au.encrypted_password IS NOT NULL as tem_senha,
    LENGTH(au.encrypted_password) as tamanho_hash,
    au.banned_until IS NULL as nao_banido,
    au.deleted_at IS NULL as nao_deletado,
    up.first_login_completed as completou_primeiro_login,
    up.is_active as perfil_ativo,
    up.role,
    -- Resultado do teste de login
    CASE 
        WHEN au.email_confirmed_at IS NULL THEN 'PROBLEMA: Email não confirmado'
        WHEN au.banned_until IS NOT NULL THEN 'PROBLEMA: Usuário banido'
        WHEN au.deleted_at IS NOT NULL THEN 'PROBLEMA: Usuário deletado'
        WHEN au.encrypted_password IS NULL THEN 'PROBLEMA: Sem senha'
        WHEN LENGTH(au.encrypted_password) < 10 THEN 'PROBLEMA: Senha corrompida'
        WHEN up.is_active = false THEN 'PROBLEMA: Perfil inativo'
        ELSE 'SUCESSO: Pode fazer login'
    END as resultado_teste_login
FROM auth.users au
INNER JOIN public.user_profiles up ON au.id = up.user_id
WHERE au.id = '9549ed2f-c2aa-47fb-ab57-9f491f57bec9';

-- ========================================
-- VERIFICAR SE NECESSITA CORREÇÃO
-- ========================================

-- 2. Se resultado foi "SUCESSO", verificar se login realmente funciona
-- (Isto significa que tecnicamente deveria funcionar)

-- 3. Se ainda há problema, pode ser:
--    - Problema no frontend (FirstTimePasswordChange)
--    - Credenciais incorretas sendo usadas
--    - Problema de cache/sessão

-- ========================================
-- AÇÕES BASEADAS NO RESULTADO
-- ========================================

-- Se resultado_teste_login = "SUCESSO: Pode fazer login":
-- → Maria Thereza deveria conseguir fazer login
-- → Verificar se credenciais estão corretas
-- → Testar no sistema

-- Se resultado_teste_login contém "PROBLEMA":
-- → Aplicar correção específica baseada no problema identificado

-- ========================================
-- CORREÇÕES CONDICIONAIS
-- ========================================

-- CORREÇÃO 1: Se email não confirmado
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW()
-- WHERE id = '9549ed2f-c2aa-47fb-ab57-9f491f57bec9' 
--   AND email_confirmed_at IS NULL;

-- CORREÇÃO 2: Se senha está nula/corrompida
-- UPDATE auth.users 
-- SET encrypted_password = crypt('MariaThereza@2025', gen_salt('bf')),
--     updated_at = NOW()
-- WHERE id = '9549ed2f-c2aa-47fb-ab57-9f491f57bec9'
--   AND (encrypted_password IS NULL OR LENGTH(encrypted_password) < 10);

-- CORREÇÃO 3: Se perfil inativo
-- UPDATE public.user_profiles 
-- SET is_active = true
-- WHERE user_id = '9549ed2f-c2aa-47fb-ab57-9f491f57bec9'
--   AND is_active = false;

-- CORREÇÃO 4: Garantir first_login_completed = false
-- UPDATE public.user_profiles 
-- SET first_login_completed = false
-- WHERE user_id = '9549ed2f-c2aa-47fb-ab57-9f491f57bec9'
--   AND first_login_completed = true;

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

-- 4. Após qualquer correção, verificar novamente
-- SELECT 
--     'VERIFICACAO_FINAL' as tipo,
--     au.email,
--     'MariaThereza@2025' as senha_temporaria,
--     au.email_confirmed_at IS NOT NULL as email_ok,
--     au.encrypted_password IS NOT NULL as senha_ok,
--     up.first_login_completed as primeiro_login_completo,
--     up.is_active as ativo,
--     up.role
-- FROM auth.users au
-- INNER JOIN public.user_profiles up ON au.id = up.user_id
-- WHERE au.id = '9549ed2f-c2aa-47fb-ab57-9f491f57bec9';

-- ℹ️ PRÓXIMOS PASSOS:
-- 1. Execute a query 1 para ver status atual
-- 2. Se resultado = "SUCESSO", teste login: Mtkkauss@gmail.com / MariaThereza@2025
-- 3. Se resultado = "PROBLEMA", aplique correção apropriada
-- 4. Execute verificação final

-- 📝 CREDENCIAIS PARA TESTE:
-- Email: Mtkkauss@gmail.com
-- Senha: MariaThereza@2025
-- Esperado: Login funcional ou redirecionamento para troca de senha 