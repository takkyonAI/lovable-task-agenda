-- 🔧 FIX: Corrigir problema de sincronização Maria Thereza Kauss
-- Data: 2025-01-10
-- Problema: Usuária existe em user_profiles mas não em auth.users

-- ========================================
-- PARTE 1: DIAGNÓSTICO COMPLETO
-- ========================================

-- 1. Confirmar o problema - Usuária no perfil mas não no auth
SELECT 
    'PERFIL EXISTE' as tipo,
    up.user_id,
    up.name,
    up.email,
    up.role,
    up.is_active,
    up.first_login_completed
FROM public.user_profiles up
WHERE up.name ILIKE '%maria%thereza%kauss%' 
   OR up.email ILIKE '%mtkkauss%';

-- 2. Confirmar que não existe no auth.users
SELECT 
    'AUTH INEXISTENTE' as tipo,
    COUNT(*) as total_encontrados
FROM auth.users au
WHERE au.email ILIKE '%mtkkauss%'
   OR au.raw_user_meta_data->>'full_name' ILIKE '%maria%thereza%kauss%';

-- ========================================
-- PARTE 2: SOLUÇÃO - CRIAR USUÁRIO NO AUTH
-- ========================================

-- 3. Criar usuário no auth.users para Maria Thereza Kauss
-- ATENÇÃO: Use o mesmo user_id que já existe no user_profiles
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud
) 
SELECT 
    up.user_id,  -- Usar o mesmo UUID do perfil
    '00000000-0000-0000-0000-000000000000',  -- instance_id padrão
    up.email,
    crypt('MariaThereza@2025', gen_salt('bf')),  -- Senha temporária segura
    NOW(),  -- Confirmar email imediatamente
    NOW(),  -- created_at
    NOW(),  -- updated_at
    '{"provider": "email", "providers": ["email"]}'::jsonb,  -- app_meta_data
    jsonb_build_object('full_name', up.name),  -- user_meta_data
    false,  -- is_super_admin
    'authenticated',  -- role padrão
    'authenticated'  -- aud padrão
FROM public.user_profiles up
WHERE up.name ILIKE '%maria%thereza%kauss%' 
   OR up.email ILIKE '%mtkkauss%';

-- 4. Forçar que ela precise trocar senha no primeiro login
UPDATE public.user_profiles 
SET first_login_completed = false,
    last_login = NULL
WHERE name ILIKE '%maria%thereza%kauss%' 
   OR email ILIKE '%mtkkauss%';

-- ========================================
-- PARTE 3: VERIFICAÇÃO FINAL
-- ========================================

-- 5. Verificar se a sincronização agora está correta
SELECT 
    'VERIFICACAO_FINAL' as tipo,
    au.id as auth_id,
    au.email as auth_email,
    au.email_confirmed_at,
    up.user_id as profile_user_id,
    up.name as profile_name,
    up.email as profile_email,
    up.first_login_completed,
    CASE 
        WHEN au.id = up.user_id THEN 'SINCRONIZADO ✅'
        ELSE 'DESSINCRONIZADO ❌'
    END as status_sync
FROM auth.users au
INNER JOIN public.user_profiles up ON au.id = up.user_id
WHERE au.email ILIKE '%mtkkauss%'
   OR up.name ILIKE '%maria%thereza%kauss%';

-- ========================================
-- PARTE 4: INSTRUÇÕES DE USO
-- ========================================

/*
🎯 INSTRUÇÕES PARA EXECUTAR:

1. Execute PARTE 1 (queries 1-2) para confirmar o problema
2. Execute PARTE 2 (queries 3-4) para corrigir o problema
3. Execute PARTE 3 (query 5) para verificar se foi corrigido

📧 CREDENCIAIS PARA MARIA THEREZA:
- Email: Mtkkauss@gmail.com
- Senha Temporária: MariaThereza@2025
- Ela DEVE trocar a senha no primeiro login

⚠️ IMPORTANTE:
- Após executar este script, envie as novas credenciais para Maria Thereza
- Ela será redirecionada para trocar a senha no primeiro acesso
- O sistema agora funcionará corretamente para ela

🔄 TESTE:
1. Maria Thereza faz login com Mtkkauss@gmail.com / MariaThereza@2025
2. Sistema redireciona para primeira mudança de senha
3. Ela define nova senha pessoal
4. Acesso liberado ao sistema principal
*/ 