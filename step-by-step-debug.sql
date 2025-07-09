-- STEP BY STEP DEBUG - Execute one query at a time
-- Date: 2025-01-08

-- CONSULTA 1: Verificar políticas restantes
SELECT policyname, cmd
FROM pg_policies 
WHERE tablename = 'tasks' AND schemaname = 'public'
ORDER BY policyname;

-- CONSULTA 2: Contar total de tarefas
SELECT COUNT(*) as total_tasks
FROM public.tasks;

-- CONSULTA 3: Contar assessoras ADM
SELECT COUNT(*) as total_assessoras_adm
FROM public.user_profiles 
WHERE role = 'assessora_adm';

-- CONSULTA 4: Simular quantas tarefas uma assessora ADM deveria ver
SELECT COUNT(*) as visible_tasks
FROM public.tasks t
WHERE (
  -- Tarefas criadas por assessoras ADM
  t.created_by IN (
    SELECT user_id FROM public.user_profiles WHERE role = 'assessora_adm'
  )
  OR
  -- Tarefas atribuídas para assessoras ADM
  t.assigned_users && (
    SELECT ARRAY_AGG(user_id) FROM public.user_profiles WHERE role = 'assessora_adm'
  )
);

-- CONSULTA 5: Verificar se as tarefas têm assigned_users preenchido
SELECT 
  COUNT(*) as tasks_with_assignments,
  COUNT(CASE WHEN assigned_users IS NOT NULL AND array_length(assigned_users, 1) > 0 THEN 1 END) as tasks_with_users
FROM public.tasks;

-- CONSULTA 6: Ver detalhes das atribuições
SELECT 
  title,
  created_by,
  assigned_users,
  array_length(assigned_users, 1) as num_assigned_users
FROM public.tasks
WHERE assigned_users IS NOT NULL
ORDER BY created_at DESC
LIMIT 5; 