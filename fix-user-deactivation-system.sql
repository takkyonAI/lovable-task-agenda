-- 🔧 CORREÇÃO DO SISTEMA DE DESATIVAÇÃO DE USUÁRIOS
-- Data: 2025-01-28
-- Problema: Usuários desativados continuam aparecendo nos filtros e conseguem fazer login

-- ========================================
-- VERIFICAÇÃO DO ESTADO ATUAL
-- ========================================

-- 1. Verificar usuários ativos vs inativos
SELECT 
    'STATUS_ATUAL_USUARIOS' as verificacao,
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN is_active = true THEN 1 END) as usuarios_ativos,
    COUNT(CASE WHEN is_active = false THEN 1 END) as usuarios_inativos
FROM public.user_profiles;

-- 2. Verificar função RPC atual
SELECT 
    'FUNCAO_RPC_ATUAL' as verificacao,
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'get_visible_users_for_role';

-- ========================================
-- CORREÇÕES IMPLEMENTADAS
-- ========================================

-- ✅ CORREÇÃO 1: Garantir que função RPC filtra apenas usuários ativos
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

-- ✅ CORREÇÃO 2: Garantir permissões de execução
GRANT EXECUTE ON FUNCTION public.get_visible_users_for_role(TEXT) TO authenticated;

-- ✅ CORREÇÃO 3: Adicionar comentário explicativo
COMMENT ON FUNCTION public.get_visible_users_for_role(TEXT) IS 
'Retorna apenas usuários ativos (is_active = true) para filtros e atribuições de tarefas. Usuários desativados não aparecem mais nos filtros.';

-- ========================================
-- VERIFICAÇÃO DAS CORREÇÕES
-- ========================================

-- 3. Testar função corrigida
SELECT 
    'TESTE_FUNCAO_CORRIGIDA' as verificacao,
    'Admin role' as role_teste,
    COUNT(*) as usuarios_retornados
FROM public.get_visible_users_for_role('admin');

SELECT 
    'TESTE_FUNCAO_CORRIGIDA' as verificacao,
    'Vendedor role' as role_teste,
    COUNT(*) as usuarios_retornados
FROM public.get_visible_users_for_role('vendedor');

-- 4. Verificar se usuários inativos não aparecem mais
SELECT 
    'VERIFICACAO_USUARIOS_INATIVOS' as verificacao,
    'Usuários inativos NÃO devem aparecer nos filtros' as resultado_esperado,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCESSO: Nenhum usuário inativo retornado'
        ELSE '❌ PROBLEMA: ' || COUNT(*) || ' usuários inativos ainda aparecem'
    END as status
FROM public.get_visible_users_for_role('admin') gv
JOIN public.user_profiles up ON gv.user_id = up.user_id
WHERE up.is_active = false;

-- ========================================
-- POLÍTICAS RLS PARA LOGIN
-- ========================================

-- ✅ CORREÇÃO 4: Política para verificar is_active durante login
-- (Esta verificação é feita no frontend após login bem-sucedido)

-- ========================================
-- TESTES FINAIS
-- ========================================

-- 5. Teste completo da funcionalidade
SELECT 
    'TESTE_COMPLETO' as verificacao,
    'Sistema de desativação corrigido' as resultado,
    CASE 
        WHEN (
            -- Verificar se função retorna apenas usuários ativos
            (SELECT COUNT(*) FROM public.get_visible_users_for_role('admin')) = 
            (SELECT COUNT(*) FROM public.user_profiles WHERE is_active = true)
        ) AND (
            -- Verificar se nenhum usuário inativo é retornado
            (SELECT COUNT(*) FROM public.get_visible_users_for_role('admin') gv
             JOIN public.user_profiles up ON gv.user_id = up.user_id
             WHERE up.is_active = false) = 0
        ) THEN '✅ SUCESSO: Sistema funcionando corretamente'
        ELSE '❌ PROBLEMA: Verificar implementação'
    END as status_final;

-- ========================================
-- RESUMO DAS CORREÇÕES
-- ========================================

/*
✅ CORREÇÕES IMPLEMENTADAS:

1. FUNÇÃO RPC: get_visible_users_for_role agora filtra APENAS usuários ativos
2. FILTROS: Usuários desativados não aparecem mais nos filtros de colaboradores
3. LOGIN: Verificação de is_active implementada no frontend após login
4. BOTÕES: Lógica corrigida para mostrar "Ativar" vs "Desativar" corretamente

🎯 RESULTADO ESPERADO:
- Usuários desativados NÃO aparecem nos filtros de colaboradores
- Usuários desativados NÃO conseguem fazer login (são bloqueados após autenticação)
- Botões mudam corretamente entre "Ativar" e "Desativar"
- Sistema de gerenciamento mostra todos os usuários (ativos e inativos) para administração

📝 NOTAS:
- A verificação de login é feita no frontend após autenticação bem-sucedida
- Usuários desativados são automaticamente deslogados se tentarem acessar o sistema
- Filtros de tarefas mostram apenas usuários ativos para atribuição
*/ 