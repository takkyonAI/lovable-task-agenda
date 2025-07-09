-- Step 8: Listar exatamente quais tarefas tatiana ADM deveria ver
-- User ID: bd0dd7f6-55fe-4c28-ac90-368addcb5f9b

SELECT 
  t.id,
  t.title,
  t.status,
  t.created_by,
  t.assigned_users,
  CASE 
    WHEN t.created_by = 'bd0dd7f6-55fe-4c28-ac90-368addcb5f9b' THEN 'Criada por ela'
    WHEN t.assigned_users @> '["bd0dd7f6-55fe-4c28-ac90-368addcb5f9b"]' THEN 'Atribuída a ela'
    WHEN t.created_by IN (SELECT up.user_id FROM user_profiles up WHERE up.role = 'assessora_adm') THEN 'Criada por assessora ADM'
    WHEN EXISTS (SELECT 1 FROM unnest(t.assigned_users) AS assigned_user JOIN user_profiles up ON assigned_user = up.user_id WHERE up.role = 'assessora_adm') THEN 'Atribuída a assessora ADM'
    ELSE 'Motivo desconhecido'
  END as motivo
FROM tasks t
WHERE 
  t.created_by = 'bd0dd7f6-55fe-4c28-ac90-368addcb5f9b' 
  OR 
  t.assigned_users @> '["bd0dd7f6-55fe-4c28-ac90-368addcb5f9b"]'
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