-- Step 7: Simular o resultado completo da política RLS
-- User ID: bd0dd7f6-55fe-4c28-ac90-368addcb5f9b

-- Esta query mostra quantas tarefas tatiana ADM deveria ver
SELECT 'Total de tarefas que tatiana ADM deveria ver:' as info, COUNT(*) as should_see_tasks
FROM tasks t
WHERE 
  -- Condição 1: Tarefas criadas por ela
  t.created_by = 'bd0dd7f6-55fe-4c28-ac90-368addcb5f9b' 
  OR 
  -- Condição 2: Tarefas atribuídas a ela
  t.assigned_users @> '["bd0dd7f6-55fe-4c28-ac90-368addcb5f9b"]'
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