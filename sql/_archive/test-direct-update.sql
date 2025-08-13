-- Teste direto de atualização na tabela user_profiles
-- Execute este script no Query Editor do Supabase

-- 1. Primeiro, listar alguns usuários para testar
SELECT id, name, email, role, created_at 
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Testar um update simples (substitua USER_ID_AQUI pelo ID real de um usuário)
-- UPDATE user_profiles 
-- SET name = 'Teste Update', email = 'teste@email.com'
-- WHERE id = 'USER_ID_AQUI';

-- 3. Verificar se há uma função set_updated_at que pode estar sendo chamada
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name ILIKE '%updated_at%';

-- 4. Verificar se há triggers que podem estar tentando usar updated_at
SELECT 
    t.tgname as trigger_name,
    p.proname as function_name,
    p.prosrc as function_source
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'user_profiles'
AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 5. Verificar se há alguma função que menciona updated_at
SELECT 
    p.proname as function_name,
    p.prosrc as function_source
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prosrc ILIKE '%updated_at%';

-- 6. Verificar se há alguma policy ou função que pode estar causando o problema
SELECT 
    p.policyname,
    p.cmd,
    p.qual,
    p.with_check
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'user_profiles'
AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 7. Verificar se há alguma trigger function relacionada
SELECT 
    t.tgname,
    f.proname,
    f.prosrc
FROM pg_trigger t
JOIN pg_proc f ON t.tgfoid = f.oid
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'user_profiles'
AND f.prosrc ILIKE '%updated_at%'; 