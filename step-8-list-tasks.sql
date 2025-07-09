-- Step 8: Listar exatamente quais tarefas tatiana ADM deveria ver
-- Substitua 'USER_ID_AQUI' pelo user_id retornado no Step 1

SELECT 
  t.id,
  t.title,
  t.status,
  t.created_by,
  t.assigned_users,
  CASE 
    WHEN t.created_by = 'USER_ID_AQUI' THEN 'Criada por ela'
    WHEN t.assigned_users @> '["USER_ID_AQUI"]' THEN 'Atribuída a ela'
    WHEN t.created_by IN (SELECT up.user_id FROM user_profiles up WHERE up.role = 'assessora_adm') THEN 'Criada por assessora ADM'
    WHEN EXISTS (SELECT 1 FROM unnest(t.assigned_users) AS assigned_user JOIN user_profiles up ON assigned_user = up.user_id WHERE up.role = 'assessora_adm') THEN 'Atribuída a assessora ADM'
    ELSE 'Motivo desconhecido'
  END as motivo
FROM tasks t
WHERE 
  t.created_by = 'USER_ID_AQUI' 
  OR 
  t.assigned_users @> '["USER_ID_AQUI"]'
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