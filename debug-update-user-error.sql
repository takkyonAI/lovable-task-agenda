-- Debug detalhado do erro de atualização de usuário
-- Execute este script no Query Editor do Supabase

-- 1. Verificar se a função get_current_user_role existe
SELECT EXISTS(
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'get_current_user_role'
    AND n.nspname = 'public'
) AS function_exists;

-- 2. Verificar estrutura da tabela user_profiles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar RLS policies para user_profiles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_profiles'
AND schemaname = 'public';

-- 4. Verificar se há triggers na tabela user_profiles
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'user_profiles'
AND event_object_schema = 'public';

-- 5. Testar uma atualização simples (substitua USER_ID_AQUI pelo ID real)
-- SELECT * FROM user_profiles WHERE id = 'USER_ID_AQUI';

-- 6. Verificar se há funções relacionadas a updated_at
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_definition ILIKE '%updated_at%';

-- 7. Verificar se há alguma view que use updated_at
SELECT table_name, view_definition
FROM information_schema.views
WHERE table_schema = 'public'
AND view_definition ILIKE '%updated_at%';

-- 8. Verificar se há alguma função que seja chamada automaticamente em updates
SELECT t.tgname, p.proname, p.prosrc
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'user_profiles'
AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'); 