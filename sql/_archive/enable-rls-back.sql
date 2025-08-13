-- Script para re-habilitar RLS após teste
-- Use este script após testar com disable-rls-test.sql

-- Step 1: Re-habilitar RLS na tabela
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Step 2: Verificar status
SELECT 'RLS STATUS APÓS RE-ENABLE:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'tasks';

-- Step 3: Verificar políticas (devem estar vazias)
SELECT 'POLÍTICAS ATUAIS:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'tasks';

SELECT '✅ RLS re-enabled! Now you need to create proper policies.' as status;
SELECT '🔧 Run fix-rls-policies-final-corrected.sql to restore proper policies.' as next_step; 