-- Correção Abrangente para Erro de Atualização de Usuário
-- Execute este script no Query Editor do Supabase

-- PASSO 1: Verificar e remover triggers incorretos na tabela user_profiles
-- (Triggers que tentam usar updated_at em uma tabela que não tem essa coluna)
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    -- Buscar triggers que mencionam updated_at na tabela user_profiles
    FOR trigger_record IN
        SELECT t.tgname as trigger_name
        FROM pg_trigger t
        JOIN pg_proc p ON t.tgfoid = p.oid
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'user_profiles'
        AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND p.prosrc ILIKE '%updated_at%'
        AND t.tgname NOT LIKE 'RI_%'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON user_profiles', trigger_record.trigger_name);
        RAISE NOTICE 'Removed trigger: %', trigger_record.trigger_name;
    END LOOP;
END $$;

-- PASSO 2: Verificar se existe e criar a função get_current_user_role se necessário
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM public.user_profiles 
        WHERE user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSO 3: Recriar políticas RLS corretas para user_profiles
-- Remover policies antigas que podem estar causando problema
DROP POLICY IF EXISTS "admin_and_franqueado_can_update_all_users" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin can update all users" ON public.user_profiles;

-- Criar policy correta para UPDATE
CREATE POLICY "admin_and_franqueado_can_update_all_users" 
ON public.user_profiles 
FOR UPDATE 
USING (
    get_current_user_role() IN ('admin', 'franqueado')
);

-- PASSO 4: Verificar se RLS está habilitado
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- PASSO 5: Criar policy para SELECT também (caso não exista)
DROP POLICY IF EXISTS "admin_and_franqueado_can_view_all_users" ON public.user_profiles;
CREATE POLICY "admin_and_franqueado_can_view_all_users" 
ON public.user_profiles 
FOR SELECT 
USING (
    get_current_user_role() IN ('admin', 'franqueado') OR
    user_id = auth.uid()
);

-- PASSO 6: Testar se o problema foi resolvido
-- (Descomente e substitua USER_ID_AQUI por um ID real para testar)
/*
DO $$
DECLARE
    test_user_id TEXT := 'USER_ID_AQUI'; -- Substitua por um ID real
    test_result BOOLEAN;
BEGIN
    -- Tentar fazer update de teste
    UPDATE user_profiles 
    SET name = name || ' (teste)' 
    WHERE id = test_user_id;
    
    GET DIAGNOSTICS test_result = FOUND;
    
    IF test_result THEN
        RAISE NOTICE 'UPDATE funcionou! Revertendo mudança...';
        -- Reverter mudança
        UPDATE user_profiles 
        SET name = REPLACE(name, ' (teste)', '') 
        WHERE id = test_user_id;
    ELSE
        RAISE NOTICE 'UPDATE não funcionou - verifique se o ID do usuário está correto';
    END IF;
END $$;
*/

-- PASSO 7: Verificar status final
SELECT 
    'VERIFICATION:' as info,
    'Function exists:' as check_type,
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE p.proname = 'get_current_user_role'
            AND n.nspname = 'public'
        ) THEN 'YES'
        ELSE 'NO'
    END as status

UNION ALL

SELECT 
    'VERIFICATION:' as info,
    'RLS enabled:' as check_type,
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE c.relname = 'user_profiles'
            AND n.nspname = 'public'
            AND c.relrowsecurity = true
        ) THEN 'YES'
        ELSE 'NO'
    END as status

UNION ALL

SELECT 
    'VERIFICATION:' as info,
    'UPDATE policy exists:' as check_type,
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM pg_policy p
            JOIN pg_class c ON p.polrelid = c.oid
            WHERE c.relname = 'user_profiles'
            AND p.cmd = 'UPDATE'
        ) THEN 'YES'
        ELSE 'NO'
    END as status

UNION ALL

SELECT 
    'VERIFICATION:' as info,
    'Incorrect triggers:' as check_type,
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM pg_trigger t
            JOIN pg_proc p ON t.tgfoid = p.oid
            JOIN pg_class c ON t.tgrelid = c.oid
            WHERE c.relname = 'user_profiles'
            AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
            AND p.prosrc ILIKE '%updated_at%'
            AND t.tgname NOT LIKE 'RI_%'
        ) THEN 'YES (PROBLEM)'
        ELSE 'NO (GOOD)'
    END as status; 