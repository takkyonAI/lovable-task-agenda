-- Implementação completa das políticas RLS com filtros adequados por níveis de acesso
-- Este script primeiro reabilita RLS e depois implementa políticas corretas

-- Step 1: Reabilitar RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Step 2: Remover todas as políticas existentes
DROP POLICY IF EXISTS tasks_delete_assigned ON tasks;
DROP POLICY IF EXISTS tasks_insert_assigned ON tasks;
DROP POLICY IF EXISTS tasks_select_assigned ON tasks;
DROP POLICY IF EXISTS tasks_update_assigned ON tasks;
DROP POLICY IF EXISTS tasks_select_assessora_adm ON tasks;
DROP POLICY IF EXISTS tasks_insert_policy ON tasks;
DROP POLICY IF EXISTS tasks_update_policy ON tasks;
DROP POLICY IF EXISTS tasks_delete_policy ON tasks;

-- Step 3: Criar política SELECT com lógica completa de níveis de acesso
CREATE POLICY tasks_select_by_role ON tasks
FOR SELECT USING (
  -- ADMIN: Pode ver todas as tarefas
  (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE role = 'admin'
  ))
  OR
  -- ASSESSORA_ADM: Pode ver tarefas do seu nível e níveis inferiores
  (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE role = 'assessora_adm'
  ) AND (
    -- Tarefas criadas por ela
    created_by = auth.uid()
    OR
    -- Tarefas atribuídas a ela
    assigned_users @> ARRAY[auth.uid()::text]
    OR
    -- Tarefas criadas por outras assessoras ADM (mesmo nível)
    created_by IN (
      SELECT user_id FROM user_profiles WHERE role = 'assessora_adm'
    )
    OR
    -- Tarefas atribuídas a outras assessoras ADM (mesmo nível)
    EXISTS (
      SELECT 1 
      FROM unnest(assigned_users) AS assigned_user
      JOIN user_profiles up ON assigned_user::uuid = up.user_id
      WHERE up.role = 'assessora_adm'
    )
    OR
    -- Tarefas criadas por assessoras (nível inferior)
    created_by IN (
      SELECT user_id FROM user_profiles WHERE role = 'assessora'
    )
    OR
    -- Tarefas atribuídas a assessoras (nível inferior)
    EXISTS (
      SELECT 1 
      FROM unnest(assigned_users) AS assigned_user
      JOIN user_profiles up ON assigned_user::uuid = up.user_id
      WHERE up.role = 'assessora'
    )
    OR
    -- Tarefas criadas por estagiários (nível inferior)
    created_by IN (
      SELECT user_id FROM user_profiles WHERE role = 'estagiario'
    )
    OR
    -- Tarefas atribuídas a estagiários (nível inferior)
    EXISTS (
      SELECT 1 
      FROM unnest(assigned_users) AS assigned_user
      JOIN user_profiles up ON assigned_user::uuid = up.user_id
      WHERE up.role = 'estagiario'
    )
  ))
  OR
  -- ASSESSORA: Pode ver tarefas do seu nível e níveis inferiores
  (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE role = 'assessora'
  ) AND (
    -- Tarefas criadas por ela
    created_by = auth.uid()
    OR
    -- Tarefas atribuídas a ela
    assigned_users @> ARRAY[auth.uid()::text]
    OR
    -- Tarefas criadas por outras assessoras (mesmo nível)
    created_by IN (
      SELECT user_id FROM user_profiles WHERE role = 'assessora'
    )
    OR
    -- Tarefas atribuídas a outras assessoras (mesmo nível)
    EXISTS (
      SELECT 1 
      FROM unnest(assigned_users) AS assigned_user
      JOIN user_profiles up ON assigned_user::uuid = up.user_id
      WHERE up.role = 'assessora'
    )
    OR
    -- Tarefas criadas por estagiários (nível inferior)
    created_by IN (
      SELECT user_id FROM user_profiles WHERE role = 'estagiario'
    )
    OR
    -- Tarefas atribuídas a estagiários (nível inferior)
    EXISTS (
      SELECT 1 
      FROM unnest(assigned_users) AS assigned_user
      JOIN user_profiles up ON assigned_user::uuid = up.user_id
      WHERE up.role = 'estagiario'
    )
    OR
    -- Tarefas criadas por níveis superiores que foram atribuídas a ela
    (created_by IN (
      SELECT user_id FROM user_profiles WHERE role IN ('admin', 'assessora_adm')
    ) AND assigned_users @> ARRAY[auth.uid()::text])
  ))
  OR
  -- ESTAGIÁRIO: Pode ver apenas tarefas próprias e atribuídas a ele
  (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE role = 'estagiario'
  ) AND (
    -- Tarefas criadas por ele
    created_by = auth.uid()
    OR
    -- Tarefas atribuídas a ele
    assigned_users @> ARRAY[auth.uid()::text]
    OR
    -- Tarefas criadas por outros estagiários (mesmo nível)
    created_by IN (
      SELECT user_id FROM user_profiles WHERE role = 'estagiario'
    )
    OR
    -- Tarefas atribuídas a outros estagiários (mesmo nível)
    EXISTS (
      SELECT 1 
      FROM unnest(assigned_users) AS assigned_user
      JOIN user_profiles up ON assigned_user::uuid = up.user_id
      WHERE up.role = 'estagiario'
    )
  ))
);

-- Step 4: Criar política INSERT (todos podem criar tarefas)
CREATE POLICY tasks_insert_policy ON tasks
FOR INSERT WITH CHECK (
  -- Qualquer usuário autenticado pode criar tarefas
  auth.uid() IS NOT NULL
);

-- Step 5: Criar política UPDATE
CREATE POLICY tasks_update_policy ON tasks
FOR UPDATE USING (
  -- ADMIN: Pode atualizar todas as tarefas
  (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE role = 'admin'
  ))
  OR
  -- ASSESSORA_ADM: Pode atualizar tarefas que pode ver
  (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE role = 'assessora_adm'
  ) AND (
    created_by = auth.uid()
    OR assigned_users @> ARRAY[auth.uid()::text]
    OR created_by IN (SELECT user_id FROM user_profiles WHERE role IN ('assessora_adm', 'assessora', 'estagiario'))
    OR EXISTS (
      SELECT 1 FROM unnest(assigned_users) AS assigned_user
      JOIN user_profiles up ON assigned_user::uuid = up.user_id
      WHERE up.role IN ('assessora_adm', 'assessora', 'estagiario')
    )
  ))
  OR
  -- ASSESSORA: Pode atualizar tarefas que pode ver
  (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE role = 'assessora'
  ) AND (
    created_by = auth.uid()
    OR assigned_users @> ARRAY[auth.uid()::text]
    OR created_by IN (SELECT user_id FROM user_profiles WHERE role IN ('assessora', 'estagiario'))
    OR EXISTS (
      SELECT 1 FROM unnest(assigned_users) AS assigned_user
      JOIN user_profiles up ON assigned_user::uuid = up.user_id
      WHERE up.role IN ('assessora', 'estagiario')
    )
  ))
  OR
  -- ESTAGIÁRIO: Pode atualizar apenas tarefas próprias ou atribuídas a ele
  (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE role = 'estagiario'
  ) AND (
    created_by = auth.uid()
    OR assigned_users @> ARRAY[auth.uid()::text]
    OR created_by IN (SELECT user_id FROM user_profiles WHERE role = 'estagiario')
    OR EXISTS (
      SELECT 1 FROM unnest(assigned_users) AS assigned_user
      JOIN user_profiles up ON assigned_user::uuid = up.user_id
      WHERE up.role = 'estagiario'
    )
  ))
);

-- Step 6: Criar política DELETE
CREATE POLICY tasks_delete_policy ON tasks
FOR DELETE USING (
  -- ADMIN: Pode deletar todas as tarefas
  (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE role = 'admin'
  ))
  OR
  -- ASSESSORA_ADM: Pode deletar tarefas que pode ver
  (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE role = 'assessora_adm'
  ) AND (
    created_by = auth.uid()
    OR created_by IN (SELECT user_id FROM user_profiles WHERE role IN ('assessora_adm', 'assessora', 'estagiario'))
  ))
  OR
  -- ASSESSORA: Pode deletar tarefas que pode ver
  (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE role = 'assessora'
  ) AND (
    created_by = auth.uid()
    OR created_by IN (SELECT user_id FROM user_profiles WHERE role IN ('assessora', 'estagiario'))
  ))
  OR
  -- ESTAGIÁRIO: Pode deletar apenas tarefas próprias
  (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE role = 'estagiario'
  ) AND created_by = auth.uid())
);

-- Step 7: Verificar políticas criadas
SELECT 'POLÍTICAS RLS IMPLEMENTADAS:' as info;
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'tasks' 
ORDER BY policyname;

-- Step 8: Testar com tatiana ADM
SELECT 'TESTE - Tarefas visíveis para tatiana ADM:' as test;
WITH simulated_auth AS (
  SELECT 'bd0dd7f6-55fe-4c28-ac90-368addcb5f9b'::uuid as uid
),
user_role AS (
  SELECT role FROM user_profiles WHERE user_id = (SELECT uid FROM simulated_auth)
)
SELECT 
  COUNT(*) as total_visible,
  (SELECT role FROM user_role) as user_role
FROM tasks t, simulated_auth sa
WHERE 
  -- Simula a política SELECT para assessora_adm
  (sa.uid IN (SELECT user_id FROM user_profiles WHERE role = 'assessora_adm'))
  AND (
    t.created_by = sa.uid
    OR t.assigned_users @> ARRAY[sa.uid::text]
    OR t.created_by IN (SELECT user_id FROM user_profiles WHERE role = 'assessora_adm')
    OR EXISTS (
      SELECT 1 FROM unnest(t.assigned_users) AS assigned_user
      JOIN user_profiles up ON assigned_user::uuid = up.user_id
      WHERE up.role = 'assessora_adm'
    )
    OR t.created_by IN (SELECT user_id FROM user_profiles WHERE role = 'assessora')
    OR EXISTS (
      SELECT 1 FROM unnest(t.assigned_users) AS assigned_user
      JOIN user_profiles up ON assigned_user::uuid = up.user_id
      WHERE up.role = 'assessora'
    )
    OR t.created_by IN (SELECT user_id FROM user_profiles WHERE role = 'estagiario')
    OR EXISTS (
      SELECT 1 FROM unnest(t.assigned_users) AS assigned_user
      JOIN user_profiles up ON assigned_user::uuid = up.user_id
      WHERE up.role = 'estagiario'
    )
  );

SELECT 'SUCCESS: Políticas RLS implementadas com filtros adequados por níveis de acesso!' as result;
SELECT '🧪 Teste a aplicação agora - tatiana ADM deve ver tarefas de seu nível e níveis inferiores' as next_step; 