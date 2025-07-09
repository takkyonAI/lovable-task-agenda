-- Step 6: Testar tarefas atribuídas a outras assessoras ADM
-- Substitua 'USER_ID_AQUI' pelo user_id retornado no Step 1

SELECT 'Tarefas atribuídas a outras assessoras ADM:' as test, COUNT(*) as count
FROM tasks t
CROSS JOIN LATERAL unnest(t.assigned_users) AS assigned_user
JOIN user_profiles up ON assigned_user = up.user_id
WHERE up.role = 'assessora_adm' 
AND assigned_user != 'USER_ID_AQUI'; 