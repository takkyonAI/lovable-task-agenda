-- Step 5: Testar condições específicas para tatiana ADM
-- Substitua 'USER_ID_AQUI' pelo user_id retornado no Step 1

-- Teste 1: Tarefas criadas por tatiana ADM
SELECT 'Tarefas criadas por tatiana ADM:' as test, COUNT(*) as count 
FROM tasks 
WHERE created_by = 'USER_ID_AQUI';

-- Teste 2: Tarefas atribuídas a tatiana ADM 
SELECT 'Tarefas atribuídas a tatiana ADM:' as test, COUNT(*) as count 
FROM tasks 
WHERE assigned_users @> '["USER_ID_AQUI"]';

-- Teste 3: Tarefas criadas por outras assessoras ADM
SELECT 'Tarefas criadas por outras assessoras ADM:' as test, COUNT(*) as count 
FROM tasks t
JOIN user_profiles up ON t.created_by = up.user_id
WHERE up.role = 'assessora_adm' 
AND t.created_by != 'USER_ID_AQUI'; 