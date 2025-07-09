-- Step 7: Simular o resultado completo da política RLS
-- Substitua 'USER_ID_AQUI' pelo user_id retornado no Step 1

-- Esta query mostra quantas tarefas tatiana ADM deveria ver
SELECT 'Total de tarefas que tatiana ADM deveria ver:' as info, COUNT(*) as should_see_tasks
FROM tasks t
WHERE 
  -- Condição 1: Tarefas criadas por ela
  t.created_by = 'USER_ID_AQUI' 
  OR 
  -- Condição 2: Tarefas atribuídas a ela
  t.assigned_users @> '["USER_ID_AQUI"]'
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