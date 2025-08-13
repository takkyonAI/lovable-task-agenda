-- Script para adicionar funcionalidade de Tarefas Privadas
-- Data: 2025-01-09
-- Funcionalidade: Adicionar campo is_private à tabela tasks

-- 1. Adicionar campo is_private à tabela tasks
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false NOT NULL;

-- 2. Adicionar comentário explicativo
COMMENT ON COLUMN public.tasks.is_private IS 'Indica se a tarefa é privada. Tarefas privadas são visíveis apenas para o criador, usuários atribuídos, admin e franqueados.';

-- 3. Criar índice para otimizar consultas de tarefas privadas
CREATE INDEX IF NOT EXISTS idx_tasks_is_private ON public.tasks(is_private);

-- 4. Atualizar políticas RLS para considerar tarefas privadas
-- Primeiro, remover as políticas existentes para recriá-las
DROP POLICY IF EXISTS "Users can view tasks based on role hierarchy" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks they have access to" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks they have access to" ON public.tasks;

-- 5. Criar nova política de SELECT considerando tarefas privadas
CREATE POLICY "Users can view tasks based on role hierarchy and privacy" ON public.tasks
FOR SELECT USING (
  -- Admin e franqueado podem ver tudo
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.role IN ('admin', 'franqueado')
  )
  OR
  -- Para tarefas públicas (is_private = false), usar a lógica hierárquica normal
  (is_private = false AND (
    -- Criador sempre pode ver suas próprias tarefas
    created_by = auth.uid()
    OR
    -- Usuário atribuído pode ver a tarefa
    auth.uid()::text = ANY(assigned_users)
    OR
    -- Lógica hierárquica de acesso baseada nos níveis
    EXISTS (
      SELECT 1 FROM user_profiles current_user
      WHERE current_user.user_id = auth.uid()
      AND (
        -- Admin pode ver tudo
        current_user.role = 'admin'
        OR
        -- Franqueado pode ver tudo
        current_user.role = 'franqueado'
        OR
        -- Coordenador pode ver: coordenador, supervisor_adm, assessora_adm, assessora, estagiario
        (current_user.role = 'coordenador' AND EXISTS (
          SELECT 1 FROM user_profiles task_user
          WHERE task_user.user_id = created_by
          AND task_user.role IN ('coordenador', 'supervisor_adm', 'assessora_adm', 'assessora', 'estagiario')
        ))
        OR
        -- Supervisor ADM pode ver: supervisor_adm, assessora_adm, assessora, estagiario
        (current_user.role = 'supervisor_adm' AND EXISTS (
          SELECT 1 FROM user_profiles task_user
          WHERE task_user.user_id = created_by
          AND task_user.role IN ('supervisor_adm', 'assessora_adm', 'assessora', 'estagiario')
        ))
        OR
        -- Assessora ADM pode ver: assessora_adm, assessora, estagiario
        (current_user.role = 'assessora_adm' AND EXISTS (
          SELECT 1 FROM user_profiles task_user
          WHERE task_user.user_id = created_by
          AND task_user.role IN ('assessora_adm', 'assessora', 'estagiario')
        ))
        OR
        -- Assessora pode ver: assessora, estagiario
        (current_user.role = 'assessora' AND EXISTS (
          SELECT 1 FROM user_profiles task_user
          WHERE task_user.user_id = created_by
          AND task_user.role IN ('assessora', 'estagiario')
        ))
        OR
        -- Estagiário pode ver apenas suas próprias tarefas e de outros estagiários
        (current_user.role = 'estagiario' AND EXISTS (
          SELECT 1 FROM user_profiles task_user
          WHERE task_user.user_id = created_by
          AND task_user.role = 'estagiario'
        ))
        OR
        -- Professor pode ver suas próprias tarefas e de estagiários
        (current_user.role = 'professor' AND EXISTS (
          SELECT 1 FROM user_profiles task_user
          WHERE task_user.user_id = created_by
          AND task_user.role IN ('professor', 'estagiario')
        ))
        OR
        -- Vendedor pode ver suas próprias tarefas e de estagiários
        (current_user.role = 'vendedor' AND EXISTS (
          SELECT 1 FROM user_profiles task_user
          WHERE task_user.user_id = created_by
          AND task_user.role IN ('vendedor', 'estagiario')
        ))
      )
    )
  ))
  OR
  -- Para tarefas privadas (is_private = true), acesso restrito
  (is_private = true AND (
    -- Criador sempre pode ver suas próprias tarefas privadas
    created_by = auth.uid()
    OR
    -- Usuário atribuído pode ver a tarefa privada
    auth.uid()::text = ANY(assigned_users)
    OR
    -- Admin e franqueado podem ver tudo
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role IN ('admin', 'franqueado')
    )
  ))
);

-- 6. Criar política de INSERT (usuários podem criar tarefas)
CREATE POLICY "Users can insert tasks" ON public.tasks
FOR INSERT WITH CHECK (
  -- Usuário deve estar autenticado
  auth.uid() IS NOT NULL
  AND
  -- Criador deve ser o usuário atual
  created_by = auth.uid()
);

-- 7. Criar política de UPDATE (usuários podem atualizar tarefas que têm acesso)
CREATE POLICY "Users can update tasks they have access to" ON public.tasks
FOR UPDATE USING (
  -- Usar a mesma lógica de visualização
  EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = tasks.id
    AND (
      -- Admin e franqueado podem atualizar tudo
      EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.user_id = auth.uid()
        AND up.role IN ('admin', 'franqueado')
      )
      OR
      -- Criador pode atualizar suas próprias tarefas
      t.created_by = auth.uid()
      OR
      -- Usuário atribuído pode atualizar a tarefa
      auth.uid()::text = ANY(t.assigned_users)
    )
  )
);

-- 8. Criar política de DELETE (usuários podem deletar tarefas que têm acesso)
CREATE POLICY "Users can delete tasks they have access to" ON public.tasks
FOR DELETE USING (
  -- Admin e franqueado podem deletar tudo
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.role IN ('admin', 'franqueado')
  )
  OR
  -- Criador pode deletar suas próprias tarefas
  created_by = auth.uid()
);

-- 9. Verificar se RLS está habilitado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    AND c.relname = 'tasks'
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
  END IF;
END$$;

-- 10. Comentários finais
COMMENT ON TABLE public.tasks IS 'Tabela de tarefas com suporte a tarefas privadas. Tarefas privadas são visíveis apenas para o criador, usuários atribuídos, admin e franqueados.';

-- Script concluído
SELECT 'Funcionalidade de Tarefas Privadas adicionada com sucesso!' as status; 