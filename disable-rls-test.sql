-- Script para TEMPORARIAMENTE desabilitar RLS e testar visibilidade
-- ⚠️ ATENÇÃO: Isso remove a segurança! Use apenas para teste!

-- Step 1: Listar políticas atuais
SELECT 'POLÍTICAS ATUAIS:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'tasks';

-- Step 2: Remover TODAS as políticas RLS
DROP POLICY IF EXISTS tasks_select_assessora_adm ON tasks;
DROP POLICY IF EXISTS tasks_insert_policy ON tasks;
DROP POLICY IF EXISTS tasks_update_policy ON tasks;
DROP POLICY IF EXISTS tasks_delete_policy ON tasks;

-- Step 3: Desabilitar RLS completamente na tabela
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- Step 4: Verificar status
SELECT 'RLS STATUS APÓS DISABLE:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'tasks';

-- Step 5: Testar quantas tarefas um usuário veria
SELECT 'TAREFAS VISÍVEIS SEM RLS:' as test;
SELECT COUNT(*) as total_tasks_visible FROM tasks;

-- Step 6: Listar todas as tarefas (sem filtros)
SELECT 'TODAS AS TAREFAS:' as list;
SELECT 
    id,
    title,
    created_by,
    assigned_users,
    (SELECT name FROM user_profiles WHERE user_id = tasks.created_by) as creator_name
FROM tasks
ORDER BY created_at DESC;

SELECT '⚠️ WARNING: RLS DISABLED! All users can see ALL tasks now!' as warning;
SELECT '🔧 To re-enable, run: ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;' as fix_command; 