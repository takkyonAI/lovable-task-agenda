
-- Criar tabela tasks
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'cancelada')),
  priority TEXT NOT NULL DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'urgente')),
  due_date DATE,
  assigned_users UUID[] DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS na tabela tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON public.tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Política para inserção de tarefas
CREATE POLICY "Usuários podem criar tarefas" 
  ON public.tasks FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

-- Política para visualização baseada na hierarquia
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

-- Política para atualização baseada na hierarquia
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

-- Política para deleção (apenas criador, admin e franqueado)
CREATE POLICY "Usuários podem deletar tarefas" 
  ON public.tasks FOR DELETE 
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'franqueado')
    )
  );
