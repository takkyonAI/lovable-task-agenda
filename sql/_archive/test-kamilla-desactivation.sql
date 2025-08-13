-- 🔍 TESTE: Verificação da Desativação da Usuária Kamilla Pedroso
-- Data: 2025-01-28
-- Problema: Desativação não está funcionando

-- ========================================
-- VERIFICAÇÃO DO ESTADO ATUAL
-- ========================================

-- 1. Verificar se Kamilla existe e seu status atual
SELECT 
    'KAMILLA_STATUS' as verificacao,
    id,
    user_id,
    name,
    email,
    role,
    is_active,
    created_at,
    last_login
FROM public.user_profiles 
WHERE name ILIKE '%kamilla%' OR email ILIKE '%kamilla%'
ORDER BY name;

-- 2. Verificar total de usuários ativos vs inativos
SELECT 
    'TOTAL_USUARIOS' as verificacao,
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN is_active = true THEN 1 END) as usuarios_ativos,
    COUNT(CASE WHEN is_active = false THEN 1 END) as usuarios_inativos
FROM public.user_profiles;

-- 3. Verificar função RPC atual
SELECT 
    'FUNCAO_RPC_ATUAL' as verificacao,
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'get_visible_users_for_role';

-- ========================================
-- TESTE DA FUNÇÃO RPC
-- ========================================

-- 4. Testar função RPC para diferentes roles
SELECT 
    'TESTE_RPC_ADMIN' as teste,
    COUNT(*) as usuarios_retornados
FROM public.get_visible_users_for_role('admin');

SELECT 
    'TESTE_RPC_VENDEDOR' as teste,
    COUNT(*) as usuarios_retornados
FROM public.get_visible_users_for_role('vendedor');

-- 5. Verificar se Kamilla aparece na função RPC
SELECT 
    'KAMILLA_NA_RPC' as verificacao,
    gv.user_id,
    gv.name,
    gv.email,
    gv.role,
    up.is_active as status_real
FROM public.get_visible_users_for_role('admin') gv
JOIN public.user_profiles up ON gv.user_id = up.user_id
WHERE gv.name ILIKE '%kamilla%' OR gv.email ILIKE '%kamilla%';

-- ========================================
-- CORREÇÃO IMEDIATA
-- ========================================

-- 6. Aplicar correção da função RPC se necessário
CREATE OR REPLACE FUNCTION public.get_visible_users_for_role(user_role TEXT)
RETURNS TABLE(user_id UUID, name TEXT, email TEXT, role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- ✅ RETORNAR APENAS USUÁRIOS ATIVOS
  RETURN QUERY 
  SELECT up.user_id, up.name, up.email, up.role
  FROM public.user_profiles up 
  WHERE up.is_active = true  -- 🔒 FILTRO CRÍTICO: Apenas usuários ativos
  ORDER BY up.name;
END;
$$;

-- 7. Garantir permissões
GRANT EXECUTE ON FUNCTION public.get_visible_users_for_role(TEXT) TO authenticated;

-- 8. Adicionar comentário
COMMENT ON FUNCTION public.get_visible_users_for_role(TEXT) IS 
'Retorna apenas usuários ativos (is_active = true) para filtros e atribuições de tarefas. Usuários desativados não aparecem mais nos filtros.';

-- ========================================
-- VERIFICAÇÃO APÓS CORREÇÃO
-- ========================================

-- 9. Testar função corrigida
SELECT 
    'TESTE_APOS_CORRECAO' as verificacao,
    'Admin role' as role_teste,
    COUNT(*) as usuarios_retornados
FROM public.get_visible_users_for_role('admin');

-- 10. Verificar se Kamilla NÃO aparece mais (se estiver desativada)
SELECT 
    'KAMILLA_APOS_CORRECAO' as verificacao,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCESSO: Kamilla não aparece mais nos filtros'
        ELSE '❌ PROBLEMA: Kamilla ainda aparece nos filtros'
    END as resultado
FROM public.get_visible_users_for_role('admin') gv
JOIN public.user_profiles up ON gv.user_id = up.user_id
WHERE gv.name ILIKE '%kamilla%' OR gv.email ILIKE '%kamilla%';

-- ========================================
-- DIAGNÓSTICO FINAL
-- ========================================

-- 11. Resumo do diagnóstico
SELECT 
    'DIAGNOSTICO_FINAL' as tipo,
    'Verificar se Kamilla está realmente desativada' as acao,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE (name ILIKE '%kamilla%' OR email ILIKE '%kamilla%') 
            AND is_active = false
        ) THEN '✅ Kamilla está desativada no banco'
        ELSE '❌ Kamilla NÃO está desativada no banco'
    END as status_banco,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.get_visible_users_for_role('admin') gv
            JOIN public.user_profiles up ON gv.user_id = up.user_id
            WHERE gv.name ILIKE '%kamilla%' OR gv.email ILIKE '%kamilla%'
        ) THEN '❌ Kamilla ainda aparece nos filtros'
        ELSE '✅ Kamilla não aparece mais nos filtros'
    END as status_filtros;

-- ========================================
-- INSTRUÇÕES PARA CORREÇÃO
-- ========================================

/*
🔧 SE KAMILLA AINDA APARECE NOS FILTROS:

1. VERIFICAR se ela está realmente desativada:
   SELECT is_active FROM public.user_profiles WHERE name ILIKE '%kamilla%';

2. SE is_active = true, desativar manualmente:
   UPDATE public.user_profiles 
   SET is_active = false 
   WHERE name ILIKE '%kamilla%';

3. VERIFICAR se a função RPC foi aplicada:
   SELECT routine_definition FROM information_schema.routines 
   WHERE routine_name = 'get_visible_users_for_role';

4. SE necessário, executar o script de correção completo:
   \i fix-user-deactivation-system.sql

5. TESTAR novamente:
   SELECT * FROM public.get_visible_users_for_role('admin');
*/ 