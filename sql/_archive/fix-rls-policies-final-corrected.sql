-- Script corrigido para as políticas RLS com tipos de dados corretos
-- Remove políticas antigas e cria políticas corretas para assessora ADM

-- Step 1: Remover todas as políticas existentes
DROP POLICY IF EXISTS tasks_delete_assigned ON tasks;
DROP POLICY IF EXISTS tasks_insert_assigned ON tasks;
DROP POLICY IF EXISTS tasks_select_assigned ON tasks;
DROP POLICY IF EXISTS tasks_update_assigned ON tasks;

-- Step 2: Criar política SELECT correta para assessoras ADM
CREATE POLICY tasks_select_assessora_adm ON tasks
FOR SELECT USING (
  -- Administrador pode ver tudo
  (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE role = 'admin'
  ))
  OR
  -- Assessora ADM pode ver:
  (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE role = 'assessora_adm'
  ) AND (
    -- 1. Tarefas criadas por ela
    created_by = auth.uid()
    OR
    -- 2. Tarefas atribuídas a ela (conversão correta de tipos)
    assigned_users @> ARRAY[auth.uid()::text]
    OR
    -- 3. Tarefas criadas por outras assessoras ADM
    created_by IN (
      SELECT user_id FROM user_profiles WHERE role = 'assessora_adm'
    )
    OR
    -- 4. Tarefas atribuídas a outras assessoras ADM
    EXISTS (
      SELECT 1 
      FROM unnest(assigned_users) AS assigned_user
      JOIN user_profiles up ON assigned_user::uuid = up.user_id
      WHERE up.role = 'assessora_adm'
    )
  ))
  OR
  -- Outros usuários podem ver tarefas criadas ou atribuídas a eles
  (created_by = auth.uid() OR assigned_users @> ARRAY[auth.uid()::text])
);

-- Step 3: Criar política INSERT
CREATE POLICY tasks_insert_policy ON tasks
FOR INSERT WITH CHECK (
  -- Qualquer usuário autenticado pode criar tarefas
  auth.uid() IS NOT NULL
);

-- Step 4: Criar política UPDATE
CREATE POLICY tasks_update_policy ON tasks
FOR UPDATE USING (
  -- Admin pode atualizar tudo
  (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE role = 'admin'
  ))
  OR
  -- Assessora ADM pode atualizar tarefas que pode ver
  (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE role = 'assessora_adm'
  ) AND (
    created_by = auth.uid()
    OR assigned_users @> ARRAY[auth.uid()::text]
    OR created_by IN (SELECT user_id FROM user_profiles WHERE role = 'assessora_adm')
    OR EXISTS (
      SELECT 1 FROM unnest(assigned_users) AS assigned_user
      JOIN user_profiles up ON assigned_user::uuid = up.user_id
      WHERE up.role = 'assessora_adm'
    )
  ))
  OR
  -- Outros usuários podem atualizar suas próprias tarefas
  (created_by = auth.uid() OR assigned_users @> ARRAY[auth.uid()::text])
);

-- Step 5: Criar política DELETE
CREATE POLICY tasks_delete_policy ON tasks
FOR DELETE USING (
  -- Admin pode deletar tudo
  (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE role = 'admin'
  ))
  OR
  -- Assessora ADM pode deletar tarefas que pode ver
  (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE role = 'assessora_adm'
  ) AND (
    created_by = auth.uid()
    OR assigned_users @> ARRAY[auth.uid()::text]
    OR created_by IN (SELECT user_id FROM user_profiles WHERE role = 'assessora_adm')
    OR EXISTS (
      SELECT 1 FROM unnest(assigned_users) AS assigned_user
      JOIN user_profiles up ON assigned_user::uuid = up.user_id
      WHERE up.role = 'assessora_adm'
    )
  ))
  OR
  -- Criador da tarefa pode deletar
  created_by = auth.uid()
);

-- Step 6: Verificar se as políticas foram criadas
SELECT 'POLÍTICAS RLS ATUALIZADAS:' as info;
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'tasks' 
ORDER BY policyname;

-- Step 7: Testar a nova política com tatiana ADM
SELECT 'TESTE DA NOVA POLÍTICA - Tarefas que tatiana ADM deveria ver:' as test;
-- Esta query simula o que auth.uid() retornaria para tatiana ADM
WITH simulated_auth AS (
  SELECT 'bd0dd7f6-55fe-4c28-ac90-368addcb5f9b'::uuid as uid
)
SELECT COUNT(*) as should_see_tasks
FROM tasks t, simulated_auth
WHERE 
  -- Simula a condição da política SELECT para assessora ADM
  (t.created_by = simulated_auth.uid
   OR t.assigned_users @> ARRAY[simulated_auth.uid::text]
   OR t.created_by IN (SELECT user_id FROM user_profiles WHERE role = 'assessora_adm')
   OR EXISTS (
     SELECT 1 FROM unnest(t.assigned_users) AS assigned_user
     JOIN user_profiles up ON assigned_user::uuid = up.user_id
     WHERE up.role = 'assessora_adm'
   ));

SELECT 'SUCCESS: RLS policies updated with correct type casting! Test the application now.' as result; 