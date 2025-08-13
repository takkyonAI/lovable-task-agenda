-- Step 4: Verificar políticas RLS ativas na tabela tasks
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'tasks' 
ORDER BY policyname; 