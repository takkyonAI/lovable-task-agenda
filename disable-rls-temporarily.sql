-- Script para desabilitar RLS temporariamente e testar se é isso que está causando o problema
-- ATENÇÃO: Execute este script apenas para DEBUG, não deixe em produção!

-- Desabilitar RLS na tabela tasks
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- Verificar se RLS foi desabilitado
SELECT 'RLS STATUS AFTER DISABLE:' as info;
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'tasks';

-- Mostrar todas as tarefas que agora devem estar visíveis
SELECT 'ALL TASKS NOW VISIBLE:' as info;
SELECT COUNT(*) as total_tasks FROM tasks;

-- Mensagem de sucesso
SELECT 'SUCCESS: RLS disabled temporarily. Test the frontend now.' as result;
SELECT 'REMEMBER: Re-enable RLS after testing by running: ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;' as warning; 