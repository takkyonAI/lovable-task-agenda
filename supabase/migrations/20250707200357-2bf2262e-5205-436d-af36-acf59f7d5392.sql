
-- Atualizar a tabela de tasks para suportar múltiplos usuários atribuídos
ALTER TABLE public.tasks DROP COLUMN IF EXISTS assigned_to;
ALTER TABLE public.tasks ADD COLUMN assigned_users UUID[] DEFAULT '{}';

-- Atualizar as políticas de RLS para tasks com a nova hierarquia
DROP POLICY IF EXISTS "Usuários podem ver tarefas relacionadas" ON public.tasks;
DROP POLICY IF EXISTS "Usuários podem atualizar tarefas próprias ou atribuídas" ON public.tasks;

-- Nova política para visualização baseada na hierarquia
CREATE POLICY "Usuários podem ver tarefas pela hierarquia" 
  ON public.tasks FOR SELECT 
  USING (
    -- Criador sempre pode ver
    auth.uid() = created_by OR
    -- Usuário está atribuído à tarefa
    auth.uid() = ANY(assigned_users) OR
    -- Admin e Franqueado veem tudo
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'franqueado')
    ) OR
    -- Coordenador vê: coordenador, professor, supervisor_adm, assessora_adm
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
    -- Supervisor ADM vê: coordenador, professor, supervisor_adm, assessora_adm
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
    )
  );

-- Nova política para atualização baseada na hierarquia
CREATE POLICY "Usuários podem atualizar tarefas pela hierarquia" 
  ON public.tasks FOR UPDATE 
  USING (
    -- Criador sempre pode atualizar
    auth.uid() = created_by OR
    -- Usuário está atribuído à tarefa
    auth.uid() = ANY(assigned_users) OR
    -- Admin e Franqueado podem tudo
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'franqueado')
    ) OR
    -- Coordenador pode atualizar tarefas dos seus subordinados
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
    -- Supervisor ADM pode atualizar tarefas dos seus subordinados
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
    )
  );

-- Função para obter usuários visíveis baseado na hierarquia
CREATE OR REPLACE FUNCTION public.get_visible_users_for_role(user_role TEXT)
RETURNS TABLE(user_id UUID, name TEXT, email TEXT, role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CASE user_role
    WHEN 'admin', 'franqueado' THEN
      RETURN QUERY 
      SELECT up.user_id, up.name, up.email, up.role
      FROM public.user_profiles up 
      WHERE up.is_active = true;
      
    WHEN 'coordenador', 'supervisor_adm' THEN
      RETURN QUERY 
      SELECT up.user_id, up.name, up.email, up.role
      FROM public.user_profiles up 
      WHERE up.is_active = true 
      AND up.role IN ('coordenador', 'professor', 'supervisor_adm', 'assessora_adm');
      
    WHEN 'professor' THEN
      RETURN QUERY 
      SELECT up.user_id, up.name, up.email, up.role
      FROM public.user_profiles up 
      WHERE up.is_active = true 
      AND up.role = 'professor';
      
    WHEN 'vendedor' THEN
      RETURN QUERY 
      SELECT up.user_id, up.name, up.email, up.role
      FROM public.user_profiles up 
      WHERE up.is_active = true 
      AND up.role = 'vendedor';
      
    ELSE
      RETURN;
  END CASE;
END;
$$;
