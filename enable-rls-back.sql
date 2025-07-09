-- Script para reabilitar RLS na tabela tasks após testes
-- Execute este script após testar com RLS desabilitado

-- Reabilitar RLS na tabela tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Verificar se RLS foi reabilitado
SELECT 'RLS STATUS AFTER ENABLE:' as info;
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'tasks';

-- Verificar se as políticas ainda existem
SELECT 'RLS POLICIES ACTIVE:' as info;
SELECT policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'tasks' 
ORDER BY policyname;

-- Mensagem de sucesso
SELECT 'SUCCESS: RLS re-enabled. Security policies are now active again.' as result; 