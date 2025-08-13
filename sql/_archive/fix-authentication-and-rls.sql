-- Correção Final: Autenticação e Políticas RLS
-- Execute este script no Query Editor do Supabase

-- PASSO 1: Criar/Recriar a função get_current_user_role
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

-- PASSO 2: Remover políticas antigas que podem estar causando conflito
DROP POLICY IF EXISTS "admin_and_franqueado_can_update_all_users" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin can update all users" ON public.user_profiles;
DROP POLICY IF EXISTS "admin_and_franqueado_can_view_all_users" ON public.user_profiles;

-- PASSO 3: Criar políticas RLS corretas

-- Política para SELECT (visualizar usuários)
CREATE POLICY "allow_read_user_profiles" 
ON public.user_profiles 
FOR SELECT 
USING (
    -- Admin e franqueado podem ver todos
    get_current_user_role() IN ('admin', 'franqueado') OR
    -- Usuário pode ver seu próprio perfil
    user_id = auth.uid()
);

-- Política para UPDATE (editar usuários)
CREATE POLICY "allow_update_user_profiles" 
ON public.user_profiles 
FOR UPDATE 
USING (
    -- Admin e franqueado podem editar todos
    get_current_user_role() IN ('admin', 'franqueado') OR
    -- Usuário pode editar seu próprio perfil
    user_id = auth.uid()
);

-- Política para INSERT (criar usuários)
CREATE POLICY "allow_insert_user_profiles" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (
    -- Admin e franqueado podem criar usuários
    get_current_user_role() IN ('admin', 'franqueado')
);

-- PASSO 4: Garantir que RLS esteja habilitado
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- PASSO 5: Verificar se as políticas foram criadas
SELECT 
    'NEW POLICIES:' as info,
    p.polname as policy_name,
    p.polcmd as command,
    p.polpermissive as permissive
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'user_profiles'
AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY p.polname;

-- PASSO 6: Teste manual de autenticação
SELECT 
    'AUTH TEST:' as info,
    'Check your authentication status' as message,
    auth.uid() as current_user_id,
    auth.email() as current_user_email,
    CASE 
        WHEN auth.uid() IS NULL THEN 'NOT AUTHENTICATED - Please login again'
        ELSE 'AUTHENTICATED'
    END as status;

-- PASSO 7: Se estiver autenticado, mostrar seu perfil
SELECT 
    'YOUR PROFILE:' as info,
    up.name,
    up.email,
    up.role,
    'You should be able to edit users now' as message
FROM public.user_profiles up
WHERE up.user_id = auth.uid();

-- PASSO 8: Instruções finais
SELECT 
    'NEXT STEPS:' as info,
    CASE 
        WHEN auth.uid() IS NULL THEN 'LOGOUT and LOGIN again in the application, then try editing users'
        ELSE 'Try editing users now - it should work!'
    END as instruction; 