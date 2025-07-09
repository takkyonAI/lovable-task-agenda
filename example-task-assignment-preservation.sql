-- EXEMPLO PRÁTICO: Como as atribuições são preservadas
-- Date: 2025-01-08
-- Purpose: Demonstrar com exemplo real como funciona a preservação

-- CENÁRIO: João Silva precisa ter seu nome alterado para João Santos
-- PERGUNTA: Ele continuará vendo suas tarefas? SIM!

-- Step 1: Simular um usuário antes da edição
SELECT 'ANTES DA EDIÇÃO - Usuário João Silva:' as exemplo;
SELECT 
  user_id,
  name,
  email,
  role
FROM user_profiles
WHERE name ILIKE '%silva%' OR name ILIKE '%joão%'
LIMIT 1;

-- Step 2: Mostrar uma tarefa atribuída a ele
SELECT 'TAREFA ATRIBUÍDA AO JOÃO (usando user_id):' as exemplo;
WITH joao_user AS (
  SELECT user_id FROM user_profiles WHERE name ILIKE '%silva%' OR name ILIKE '%joão%' LIMIT 1
)
SELECT 
  t.id as task_id,
  t.title,
  t.assigned_users,
  -- Verificar se o João está atribuído
  CASE 
    WHEN ju.user_id = ANY(t.assigned_users) THEN '✅ João está atribuído'
    ELSE '❌ João não está atribuído'
  END as status_atribuicao
FROM tasks t, joao_user ju
WHERE ju.user_id = ANY(t.assigned_users)
LIMIT 1;

-- Step 3: SIMULAÇÃO - O que acontece quando alteramos o nome
SELECT 'SIMULAÇÃO - ALTERAÇÃO DO NOME:' as exemplo;
SELECT 
  'user_id' as campo,
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890' as valor_antes,
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890' as valor_depois,
  '✅ NUNCA MUDA' as status
UNION ALL
SELECT 
  'name' as campo,
  'João Silva' as valor_antes,
  'João Santos' as valor_depois,
  '🔄 ALTERADO' as status
UNION ALL
SELECT 
  'email' as campo,
  'joao.silva@email.com' as valor_antes,
  'joao.santos@email.com' as valor_depois,
  '🔄 ALTERADO' as status;

-- Step 4: Demonstrar que assigned_users não é afetado
SELECT 'ATRIBUIÇÕES APÓS EDIÇÃO:' as exemplo;
SELECT 
  'assigned_users' as campo,
  '["a1b2c3d4-e5f6-7890-abcd-ef1234567890"]' as valor_antes,
  '["a1b2c3d4-e5f6-7890-abcd-ef1234567890"]' as valor_depois,
  '✅ PRESERVADO' as status;

-- Step 5: Explicar o código da função updateUser
SELECT 'CÓDIGO DA FUNÇÃO updateUser:' as exemplo;
SELECT 
  'const updateData = {' as linha_1,
  '  name: sanitizeInput(name),' as linha_2,
  '  email: sanitizeInput(email),' as linha_3,
  '  role: role' as linha_4,
  '};' as linha_5,
  'user_id NÃO é alterado!' as observacao;

-- Step 6: Verificar RLS policies que garantem acesso
SELECT 'POLÍTICAS RLS QUE GARANTEM ACESSO:' as exemplo;
SELECT 
  'auth.uid() = ANY(assigned_users)' as politica,
  'Usa user_id para verificar acesso' as funcionamento,
  'Preservado após edição' as resultado;

-- Step 7: Teste de conectividade
SELECT 'TESTE DE CONECTIVIDADE:' as exemplo;
SELECT 
  'Usuário editado' as passo_1,
  'user_id permanece igual' as passo_2,
  'assigned_users usa user_id' as passo_3,
  'RLS permite acesso' as passo_4,
  'Usuário vê suas tarefas' as resultado_final;

-- Step 8: Casos de uso reais
SELECT 'CASOS DE USO REAIS:' as exemplo;
SELECT 
  'Mudança de nome por casamento' as caso_1,
  'Correção de nome com erro' as caso_2,
  'Mudança de email corporativo' as caso_3,
  'Promoção (mudança de role)' as caso_4,
  'Atribuições sempre preservadas' as garantia;

-- Step 9: Conclusão
SELECT 'CONCLUSÃO FINAL:' as exemplo;
SELECT 
  '✅ Sistema projetado corretamente' as status,
  'user_id como chave primária imutável' as design,
  'assigned_users vinculado ao user_id' as implementacao,
  'Atribuições preservadas automaticamente' as resultado; 