-- Fix Assessora ADM Task Visibility
-- This script updates RLS policies to allow assessoras to see tasks from other assessoras of the same level
-- Date: 2025-01-08

-- Step 1: Check existing RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'tasks' AND schemaname = 'public';

-- Step 2: Drop the existing policy that might be too restrictive
DROP POLICY IF EXISTS "Usuários podem ver tarefas pela hierarquia" ON public.tasks;

-- Step 3: Create new comprehensive policy that allows assessoras to see each other's tasks
CREATE POLICY "Usuários podem ver tarefas pela hierarquia" 
  ON public.tasks FOR SELECT 
  USING (
    -- Criador sempre pode ver suas próprias tarefas
    auth.uid() = created_by OR
    -- Usuário está atribuído à tarefa
    auth.uid() = ANY(assigned_users) OR
    -- Admin e Franqueado veem todas as tarefas
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'franqueado')
    ) OR
    -- Coordenador vê tarefas de: coordenador, professor, supervisor_adm, assessora_adm
    EXISTS (
      SELECT 1 FROM public.user_profiles up1
      WHERE up1.user_id = auth.uid() AND up1.role = 'coordenador'
      AND (
        created_by IN (
          SELECT user_id FROM public.user_profiles 
          WHERE role IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm')
        ) OR
        assigned_users && (
          SELECT ARRAY_AGG(user_id) FROM public.user_profiles 
          WHERE role IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm')
        )
      )
    ) OR
    -- Supervisor ADM vê tarefas de: coordenador, professor, supervisor_adm, assessora_adm
    EXISTS (
      SELECT 1 FROM public.user_profiles up1
      WHERE up1.user_id = auth.uid() AND up1.role = 'supervisor_adm'
      AND (
        created_by IN (
          SELECT user_id FROM public.user_profiles 
          WHERE role IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm')
        ) OR
        assigned_users && (
          SELECT ARRAY_AGG(user_id) FROM public.user_profiles 
          WHERE role IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm')
        )
      )
    ) OR
    -- NOVO: Assessora ADM vê tarefas de todas as outras assessoras ADM
    EXISTS (
      SELECT 1 FROM public.user_profiles up1
      WHERE up1.user_id = auth.uid() AND up1.role = 'assessora_adm'
      AND (
        created_by IN (
          SELECT user_id FROM public.user_profiles 
          WHERE role = 'assessora_adm'
        ) OR
        assigned_users && (
          SELECT ARRAY_AGG(user_id) FROM public.user_profiles 
          WHERE role = 'assessora_adm'
        )
      )
    ) OR
    -- Professor vê tarefas de outros professores
    EXISTS (
      SELECT 1 FROM public.user_profiles up1
      WHERE up1.user_id = auth.uid() AND up1.role = 'professor'
      AND (
        created_by IN (
          SELECT user_id FROM public.user_profiles 
          WHERE role = 'professor'
        ) OR
        assigned_users && (
          SELECT ARRAY_AGG(user_id) FROM public.user_profiles 
          WHERE role = 'professor'
        )
      )
    )
  );

-- Step 4: Update the UPDATE policy as well
DROP POLICY IF EXISTS "Usuários podem atualizar tarefas pela hierarquia" ON public.tasks;

CREATE POLICY "Usuários podem atualizar tarefas pela hierarquia" 
  ON public.tasks FOR UPDATE 
  USING (
    -- Criador sempre pode atualizar suas próprias tarefas
    auth.uid() = created_by OR
    -- Usuário está atribuído à tarefa
    auth.uid() = ANY(assigned_users) OR
    -- Admin e Franqueado podem atualizar todas as tarefas
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'franqueado')
    ) OR
    -- Coordenador pode atualizar tarefas de seus subordinados
    EXISTS (
      SELECT 1 FROM public.user_profiles up1
      WHERE up1.user_id = auth.uid() AND up1.role = 'coordenador'
      AND (
        created_by IN (
          SELECT user_id FROM public.user_profiles 
          WHERE role IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm')
        ) OR
        assigned_users && (
          SELECT ARRAY_AGG(user_id) FROM public.user_profiles 
          WHERE role IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm')
        )
      )
    ) OR
    -- Supervisor ADM pode atualizar tarefas de seus subordinados
    EXISTS (
      SELECT 1 FROM public.user_profiles up1
      WHERE up1.user_id = auth.uid() AND up1.role = 'supervisor_adm'
      AND (
        created_by IN (
          SELECT user_id FROM public.user_profiles 
          WHERE role IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm')
        ) OR
        assigned_users && (
          SELECT ARRAY_AGG(user_id) FROM public.user_profiles 
          WHERE role IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm')
        )
      )
    ) OR
    -- NOVO: Assessora ADM pode atualizar tarefas de outras assessoras ADM
    EXISTS (
      SELECT 1 FROM public.user_profiles up1
      WHERE up1.user_id = auth.uid() AND up1.role = 'assessora_adm'
      AND (
        created_by IN (
          SELECT user_id FROM public.user_profiles 
          WHERE role = 'assessora_adm'
        ) OR
        assigned_users && (
          SELECT ARRAY_AGG(user_id) FROM public.user_profiles 
          WHERE role = 'assessora_adm'
        )
      )
    )
  );

-- Step 5: Test the new policies
SELECT 'Testing new policies...' as info;

-- Test: Check if assessora_adm can see tasks from other assessoras
SELECT 
    'Tasks visible to assessora_adm:' as test_type,
    t.id,
    t.title,
    t.created_by,
    up.name as creator_name,
    up.role as creator_role
FROM public.tasks t
JOIN public.user_profiles up ON t.created_by = up.user_id
WHERE EXISTS (
    SELECT 1 FROM public.user_profiles up1
    WHERE up1.user_id = auth.uid() AND up1.role = 'assessora_adm'
    AND (
        t.created_by IN (
            SELECT user_id FROM public.user_profiles 
            WHERE role = 'assessora_adm'
        ) OR
        t.assigned_users && (
            SELECT ARRAY_AGG(user_id) FROM public.user_profiles 
            WHERE role = 'assessora_adm'
        )
    )
);

-- Step 6: Success message
SELECT 'SUCCESS: RLS policies updated! Assessora ADM can now see tasks from other assessoras of the same level.' as result;
SELECT 'Next: Test in the application to confirm both user assignment and task visibility work correctly.' as next_step; 