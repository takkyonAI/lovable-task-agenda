-- Step 6: Testar tarefas atribuídas a outras assessoras ADM
-- User ID: bd0dd7f6-55fe-4c28-ac90-368addcb5f9b

SELECT 'Tarefas atribuídas a outras assessoras ADM:' as test, COUNT(*) as count
FROM tasks t
CROSS JOIN LATERAL unnest(t.assigned_users) AS assigned_user
JOIN user_profiles up ON assigned_user = up.user_id
WHERE up.role = 'assessora_adm' 
AND assigned_user != 'bd0dd7f6-55fe-4c28-ac90-368addcb5f9b'; 