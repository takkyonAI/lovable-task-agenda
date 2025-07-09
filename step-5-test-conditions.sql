-- Step 5: Testar condições específicas para tatiana ADM
-- User ID: bd0dd7f6-55fe-4c28-ac90-368addcb5f9b

-- Teste 1: Tarefas criadas por tatiana ADM
SELECT 'Tarefas criadas por tatiana ADM:' as test, COUNT(*) as count 
FROM tasks 
WHERE created_by = 'bd0dd7f6-55fe-4c28-ac90-368addcb5f9b';

-- Teste 2: Tarefas atribuídas a tatiana ADM 
SELECT 'Tarefas atribuídas a tatiana ADM:' as test, COUNT(*) as count 
FROM tasks 
WHERE assigned_users @> '["bd0dd7f6-55fe-4c28-ac90-368addcb5f9b"]';

-- Teste 3: Tarefas criadas por outras assessoras ADM
SELECT 'Tarefas criadas por outras assessoras ADM:' as test, COUNT(*) as count 
FROM tasks t
JOIN user_profiles up ON t.created_by = up.user_id
WHERE up.role = 'assessora_adm' 
AND t.created_by != 'bd0dd7f6-55fe-4c28-ac90-368addcb5f9b'; 