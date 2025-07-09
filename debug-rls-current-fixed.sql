-- Debug script corrigido para testar as políticas RLS
-- Este script funciona sem SET SESSION AUTHORIZATION

-- Step 1: Obter o user_id correto da assessora ADM
SELECT 'ASSESSORA ADM USER INFO:' as info;
SELECT user_id, email, name, role 
FROM user_profiles 
WHERE email = 'tatianarbeiroadvogada@gmail.com';

-- Step 2: Mostrar todas as tarefas no banco
SELECT 'TOTAL TASKS IN DATABASE:' as info;
SELECT COUNT(*) as total_tasks FROM tasks;

-- Step 3: Listar todas as tarefas com detalhes
SELECT 'ALL TASKS WITH DETAILS:' as info;
SELECT id, title, status, created_by, assigned_users, created_at
FROM tasks 
ORDER BY created_at DESC;

-- Step 4: Verificar as políticas RLS atuais
SELECT 'CURRENT RLS POLICIES:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'tasks' 
ORDER BY policyname;

-- Step 5: Verificar RLS habilitado
SELECT 'RLS STATUS:' as info;
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'tasks';

-- Step 6: Testar condições específicas para tatiana adm
-- Primeiro obter o user_id correto
WITH tatiana_user AS (
  SELECT user_id 
  FROM user_profiles 
  WHERE email = 'tatianarbeiroadvogada@gmail.com'
)
SELECT 'TESTS FOR TATIANA ADM:' as info;

-- Test 1: Tarefas criadas por tatiana adm
WITH tatiana_user AS (
  SELECT user_id 
  FROM user_profiles 
  WHERE email = 'tatianarbeiroadvogada@gmail.com'
)
SELECT 'Tasks created by tatiana adm:' as test1, COUNT(*) as count 
FROM tasks, tatiana_user
WHERE created_by = tatiana_user.user_id;

-- Test 2: Tarefas atribuídas a tatiana adm
WITH tatiana_user AS (
  SELECT user_id 
  FROM user_profiles 
  WHERE email = 'tatianarbeiroadvogada@gmail.com'
)
SELECT 'Tasks assigned to tatiana adm:' as test2, COUNT(*) as count 
FROM tasks, tatiana_user
WHERE assigned_users @> ARRAY[tatiana_user.user_id];

-- Test 3: Tarefas criadas por outras assessoras ADM
WITH tatiana_user AS (
  SELECT user_id 
  FROM user_profiles 
  WHERE email = 'tatianarbeiroadvogada@gmail.com'
)
SELECT 'Tasks created by other assessoras ADM:' as test3, COUNT(*) as count 
FROM tasks t
JOIN user_profiles up ON t.created_by = up.user_id, tatiana_user
WHERE up.role = 'assessora_adm' 
AND t.created_by != tatiana_user.user_id;

-- Test 4: Tarefas atribuídas a outras assessoras ADM
WITH tatiana_user AS (
  SELECT user_id 
  FROM user_profiles 
  WHERE email = 'tatianarbeiroadvogada@gmail.com'
)
SELECT 'Tasks assigned to other assessoras ADM:' as test4, COUNT(*) as count
FROM tasks t
CROSS JOIN LATERAL unnest(t.assigned_users) AS assigned_user
JOIN user_profiles up ON assigned_user = up.user_id, tatiana_user
WHERE up.role = 'assessora_adm' 
AND assigned_user != tatiana_user.user_id;

-- Step 7: Mostrar todas as assessoras ADM
SELECT 'ALL ASSESSORAS ADM:' as info;
SELECT user_id, email, name, role 
FROM user_profiles 
WHERE role = 'assessora_adm'
ORDER BY email;

-- Step 8: Simular a condição completa da política RLS
WITH tatiana_user AS (
  SELECT user_id 
  FROM user_profiles 
  WHERE email = 'tatianarbeiroadvogada@gmail.com'
)
SELECT 'SIMULATED RLS POLICY RESULT:' as info;

-- Esta query simula exatamente o que a política RLS deveria permitir
WITH tatiana_user AS (
  SELECT user_id 
  FROM user_profiles 
  WHERE email = 'tatianarbeiroadvogada@gmail.com'
)
SELECT COUNT(*) as should_see_tasks
FROM tasks t, tatiana_user tu
WHERE 
  -- Condição 1: Tarefas criadas por ela
  t.created_by = tu.user_id 
  OR 
  -- Condição 2: Tarefas atribuídas a ela
  t.assigned_users @> ARRAY[tu.user_id]
  OR 
  -- Condição 3: Tarefas criadas por outras assessoras ADM
  t.created_by IN (
    SELECT up.user_id 
    FROM user_profiles up 
    WHERE up.role = 'assessora_adm'
  )
  OR 
  -- Condição 4: Tarefas atribuídas a outras assessoras ADM
  EXISTS (
    SELECT 1 
    FROM unnest(t.assigned_users) AS assigned_user
    JOIN user_profiles up ON assigned_user = up.user_id
    WHERE up.role = 'assessora_adm'
  );

-- Step 9: Listar exatamente quais tarefas ela deveria ver
WITH tatiana_user AS (
  SELECT user_id 
  FROM user_profiles 
  WHERE email = 'tatianarbeiroadvogada@gmail.com'
)
SELECT 'TASKS TATIANA SHOULD SEE:' as info;

WITH tatiana_user AS (
  SELECT user_id 
  FROM user_profiles 
  WHERE email = 'tatianarbeiroadvogada@gmail.com'
)
SELECT 
  t.id,
  t.title,
  t.status,
  t.created_by,
  t.assigned_users,
  CASE 
    WHEN t.created_by = tu.user_id THEN 'Created by her'
    WHEN t.assigned_users @> ARRAY[tu.user_id] THEN 'Assigned to her'
    WHEN t.created_by IN (SELECT up.user_id FROM user_profiles up WHERE up.role = 'assessora_adm') THEN 'Created by assessora ADM'
    WHEN EXISTS (SELECT 1 FROM unnest(t.assigned_users) AS assigned_user JOIN user_profiles up ON assigned_user = up.user_id WHERE up.role = 'assessora_adm') THEN 'Assigned to assessora ADM'
    ELSE 'Unknown reason'
  END as reason
FROM tasks t, tatiana_user tu
WHERE 
  t.created_by = tu.user_id 
  OR 
  t.assigned_users @> ARRAY[tu.user_id]
  OR 
  t.created_by IN (
    SELECT up.user_id 
    FROM user_profiles up 
    WHERE up.role = 'assessora_adm'
  )
  OR 
  EXISTS (
    SELECT 1 
    FROM unnest(t.assigned_users) AS assigned_user
    JOIN user_profiles up ON assigned_user = up.user_id
    WHERE up.role = 'assessora_adm'
  )
ORDER BY t.created_at DESC;

SELECT 'FINAL SUMMARY: This is exactly what tatiana adm should see through RLS' as conclusion; 