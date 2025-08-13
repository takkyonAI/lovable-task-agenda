-- Fix Trigger Issue - Detectar e corrigir triggers incorretos na tabela user_profiles
-- Execute este script no Query Editor do Supabase

-- 1. Verificar todos os triggers existentes na tabela user_profiles
SELECT 
    'TRIGGERS ON user_profiles:' as info,
    t.tgname as trigger_name,
    t.tgenabled as enabled,
    p.proname as function_name,
    p.prosrc as function_source
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'user_profiles'
AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND t.tgname NOT LIKE 'RI_%'; -- Excluir triggers internos

-- 2. Verificar se há algum trigger que menciona updated_at
SELECT 
    'TRIGGERS WITH updated_at:' as info,
    t.tgname as trigger_name,
    p.proname as function_name,
    p.prosrc as function_source
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'user_profiles'
AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND p.prosrc ILIKE '%updated_at%'
AND t.tgname NOT LIKE 'RI_%';

-- 3. Verificar se existe a função update_updated_at_column
SELECT 
    'FUNCTION update_updated_at_column:' as info,
    p.proname as function_name,
    p.prosrc as function_source
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'update_updated_at_column';

-- 4. Verificar se há triggers incorretos que podem estar sendo aplicados
-- Se um trigger da tabela tasks foi aplicado por engano na user_profiles
SELECT 
    'INCORRECT TRIGGERS ON user_profiles:' as info,
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'user_profiles'
AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND t.tgname ILIKE '%updated_at%'
AND t.tgname NOT LIKE 'RI_%';

-- 5. Se encontrar triggers incorretos, remover eles
-- (Descomente apenas se o script acima mostrar triggers incorretos)
-- DROP TRIGGER IF EXISTS update_tasks_updated_at ON user_profiles;
-- DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;

-- 6. Verificar se há policies que podem estar causando o problema
SELECT 
    'POLICIES ON user_profiles:' as info,
    p.policyname,
    p.cmd,
    p.qual,
    p.with_check
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'user_profiles'
AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 7. Verificar se há alguma função que está tentando usar updated_at em user_profiles
SELECT 
    'FUNCTIONS MENTIONING updated_at:' as info,
    p.proname as function_name,
    p.prosrc as function_source
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prosrc ILIKE '%updated_at%'
AND p.prosrc ILIKE '%user_profiles%';

-- 8. Testar update direto (substitua USER_ID_AQUI por um ID real)
SELECT 
    'TEST UPDATE PREPARATION:' as info,
    'Execute the following UPDATE statement with a real user ID:' as instruction,
    'UPDATE user_profiles SET name = name WHERE id = ''USER_ID_AQUI'';' as example_query; 