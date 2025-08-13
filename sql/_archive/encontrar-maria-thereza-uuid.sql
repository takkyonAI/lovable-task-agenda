-- 🔍 ENCONTRAR UUID CORRETO - Maria Thereza Kauss
-- Data: 2025-01-10
-- Problema: UUID usado não retorna resultados

-- ========================================
-- BUSCAR POR EMAIL EM TODAS AS VARIAÇÕES
-- ========================================

-- 1. Buscar em user_profiles por email
SELECT 
    'USER_PROFILES' as tabela,
    up.id,
    up.user_id,
    up.name,
    up.email,
    up.role,
    up.is_active,
    up.first_login_completed,
    up.created_at
FROM public.user_profiles up
WHERE up.email ILIKE '%mtkkauss%'
   OR up.email ILIKE '%maria%thereza%'
   OR up.email ILIKE '%kauss%'
   OR up.name ILIKE '%maria%thereza%'
   OR up.name ILIKE '%kauss%';

-- 2. Buscar em auth.users por email
SELECT 
    'AUTH_USERS' as tabela,
    au.id,
    au.email,
    au.created_at,
    au.email_confirmed_at,
    au.last_sign_in_at,
    au.raw_user_meta_data->>'full_name' as full_name
FROM auth.users au
WHERE au.email ILIKE '%mtkkauss%'
   OR au.email ILIKE '%maria%thereza%'
   OR au.email ILIKE '%kauss%'
   OR au.raw_user_meta_data->>'full_name' ILIKE '%maria%thereza%'
   OR au.raw_user_meta_data->>'full_name' ILIKE '%kauss%';

-- 3. Buscar por email exato (caso sensitivo)
SELECT 
    'BUSCA_EXATA' as tipo,
    up.user_id,
    up.email as profile_email,
    up.name,
    au.email as auth_email,
    au.id as auth_id,
    up.user_id = au.id as ids_sincronizados
FROM public.user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
WHERE up.email = 'Mtkkauss@gmail.com'
   OR au.email = 'Mtkkauss@gmail.com';

-- 4. Listar TODOS os usuários para verificar se existe
SELECT 
    'TODOS_USUARIOS' as tipo,
    up.user_id,
    up.name,
    up.email,
    up.role,
    up.is_active,
    up.created_at
FROM public.user_profiles up
ORDER BY up.created_at DESC
LIMIT 20;

-- 5. Verificar se existe algum usuário com "maria" no nome
SELECT 
    'USUARIOS_MARIA' as tipo,
    up.user_id,
    up.name,
    up.email,
    up.role,
    up.is_active,
    up.first_login_completed
FROM public.user_profiles up
WHERE up.name ILIKE '%maria%'
   OR up.email ILIKE '%maria%';

-- ========================================
-- VERIFICAR PROBLEMAS DE SINCRONIZAÇÃO
-- ========================================

-- 6. Verificar usuários órfãos (existem em user_profiles mas não em auth.users)
SELECT 
    'USUARIOS_ORFAOS' as tipo,
    up.user_id,
    up.name,
    up.email,
    up.role,
    'EXISTE_NO_PROFILE_NAO_NO_AUTH' as problema
FROM public.user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
WHERE au.id IS NULL;

-- 7. Verificar usuários desconectados (existem em auth.users mas não em user_profiles)
SELECT 
    'USUARIOS_DESCONECTADOS' as tipo,
    au.id,
    au.email,
    au.raw_user_meta_data->>'full_name' as full_name,
    'EXISTE_NO_AUTH_NAO_NO_PROFILE' as problema
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id
WHERE up.user_id IS NULL;

-- ========================================
-- VERIFICAR UUID ANTIGO
-- ========================================

-- 8. Verificar se UUID antigo existe em algum lugar
SELECT 
    'VERIFICAR_UUID_ANTIGO' as tipo,
    '9549ed2f-c2aa-47fb-ab57-9f491f57bec9' as uuid_procurado,
    EXISTS(
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = '9549ed2f-c2aa-47fb-ab57-9f491f57bec9'
    ) as existe_em_profiles,
    EXISTS(
        SELECT 1 FROM auth.users 
        WHERE id = '9549ed2f-c2aa-47fb-ab57-9f491f57bec9'
    ) as existe_em_auth;

-- ℹ️ INSTRUÇÕES:
-- 1. Execute todas as queries acima
-- 2. Procure por "Maria Thereza" ou "Mtkkauss@gmail.com" nos resultados
-- 3. Se encontrar, anote o UUID correto
-- 4. Se não encontrar, usuária pode ter sido deletada ou email está diferente

-- 📝 NOTA:
-- Se nenhum resultado for encontrado, pode ser que:
-- - Email esteja grafado diferente
-- - Usuária foi deletada
-- - Problema na criação inicial 