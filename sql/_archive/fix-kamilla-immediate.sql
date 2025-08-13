-- 🚨 CORREÇÃO IMEDIATA: Kamilla Pedroso não está sendo filtrada
-- Data: 2025-01-28
-- Problema: Desativação não está funcionando nos filtros

-- ========================================
-- DIAGNÓSTICO IMEDIATO
-- ========================================

-- 1. Verificar status atual da Kamilla
SELECT 
    'KAMILLA_STATUS_ATUAL' as verificacao,
    id,
    user_id,
    name,
    email,
    role,
    is_active,
    created_at
FROM public.user_profiles 
WHERE name ILIKE '%kamilla%' OR email ILIKE '%kamilla%';

-- 2. Verificar se a função RPC está funcionando
SELECT 
    'FUNCAO_RPC_STATUS' as verificacao,
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'get_visible_users_for_role';

-- ========================================
-- CORREÇÃO IMEDIATA
-- ========================================

-- 3. FORÇAR desativação da Kamilla (se necessário)
UPDATE public.user_profiles 
SET is_active = false 
WHERE name ILIKE '%kamilla%' OR email ILIKE '%kamilla%';

-- 4. RECRIAR função RPC com filtro correto
DROP FUNCTION IF EXISTS public.get_visible_users_for_role(TEXT);

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

-- 5. Garantir permissões
GRANT EXECUTE ON FUNCTION public.get_visible_users_for_role(TEXT) TO authenticated;

-- 6. Adicionar comentário
COMMENT ON FUNCTION public.get_visible_users_for_role(TEXT) IS 
'Retorna apenas usuários ativos (is_active = true) para filtros e atribuições de tarefas. Usuários desativados não aparecem mais nos filtros.';

-- ========================================
-- VERIFICAÇÃO IMEDIATA
-- ========================================

-- 7. Verificar se Kamilla foi desativada
SELECT 
    'KAMILLA_APOS_DESATIVACAO' as verificacao,
    id,
    name,
    email,
    is_active,
    CASE 
        WHEN is_active = false THEN '✅ DESATIVADA'
        ELSE '❌ AINDA ATIVA'
    END as status
FROM public.user_profiles 
WHERE name ILIKE '%kamilla%' OR email ILIKE '%kamilla%';

-- 8. Testar função RPC
SELECT 
    'TESTE_RPC_CORRIGIDA' as verificacao,
    COUNT(*) as total_usuarios_ativos
FROM public.get_visible_users_for_role('admin');

-- 9. Verificar se Kamilla NÃO aparece mais nos filtros
SELECT 
    'KAMILLA_NOS_FILTROS' as verificacao,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCESSO: Kamilla não aparece mais nos filtros'
        ELSE '❌ PROBLEMA: Kamilla ainda aparece nos filtros'
    END as resultado
FROM public.get_visible_users_for_role('admin') gv
JOIN public.user_profiles up ON gv.user_id = up.user_id
WHERE gv.name ILIKE '%kamilla%' OR gv.email ILIKE '%kamilla%';

-- ========================================
-- LIMPEZA DE CACHE (se necessário)
-- ========================================

-- 10. Forçar refresh das políticas RLS
NOTIFY pgrst, 'reload schema';

-- ========================================
-- RESULTADO FINAL
-- ========================================

-- 11. Resumo da correção
SELECT 
    'CORRECAO_APLICADA' as tipo,
    'Kamilla Pedroso deve estar desativada e não aparecer nos filtros' as resultado_esperado,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE (name ILIKE '%kamilla%' OR email ILIKE '%kamilla%') 
            AND is_active = false
        ) THEN '✅ Kamilla está desativada'
        ELSE '❌ Kamilla NÃO está desativada'
    END as status_desativacao,
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM public.get_visible_users_for_role('admin') gv
            JOIN public.user_profiles up ON gv.user_id = up.user_id
            WHERE gv.name ILIKE '%kamilla%' OR gv.email ILIKE '%kamilla%'
        ) THEN '✅ Kamilla não aparece nos filtros'
        ELSE '❌ Kamilla ainda aparece nos filtros'
    END as status_filtros;

-- ========================================
-- INSTRUÇÕES PARA TESTE
-- ========================================

/*
🎯 APÓS EXECUTAR ESTE SCRIPT:

1. VERIFICAR no frontend se Kamilla não aparece mais nos filtros
2. VERIFICAR se o botão mudou para "Ativar" (verde)
3. VERIFICAR se ela aparece como "Inativo" na listagem de usuários

🔧 SE AINDA NÃO FUNCIONAR:

1. Verificar se há cache no navegador (F5 ou Ctrl+F5)
2. Verificar se o frontend está usando a função RPC correta
3. Verificar logs do console para erros
4. Executar o script completo: fix-user-deactivation-system.sql

📝 NOTA: Este script força a desativação e recria a função RPC
*/ 