-- Step 3: Verificar se RLS está habilitado na tabela tasks
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'tasks'; 