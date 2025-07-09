-- Migration: Add is_private column to tasks table
-- Date: 2025-01-07
-- Issue: Vanessa (assessora_adm) getting PGRST204 error when creating tasks
-- Fix: Add missing is_private column

-- Add the is_private column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN is_private BOOLEAN NOT NULL DEFAULT false;

-- Add comment to document the column
COMMENT ON COLUMN public.tasks.is_private IS 'Indicates if the task is private (visible only to creator, assigned users, and admin/franqueado)';

-- Update the existing SELECT policy to handle private tasks
DROP POLICY IF EXISTS "Usuários podem ver tarefas pela hierarquia" ON public.tasks;

CREATE POLICY "Usuários podem ver tarefas pela hierarquia" 
  ON public.tasks FOR SELECT 
  USING (
    -- For public tasks (is_private = false), use existing hierarchy rules
    (is_private = false AND (
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
    ))
    OR
    -- For private tasks (is_private = true), restricted access
    (is_private = true AND (
      -- Criador sempre pode ver suas próprias tarefas privadas
      auth.uid() = created_by OR
      -- Usuário atribuído pode ver a tarefa privada
      auth.uid() = ANY(assigned_users) OR
      -- Admin e franqueado podem ver tudo
      EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'franqueado')
      )
    ))
  );

-- Refresh the PostgREST schema cache
SELECT pg_notify('pgrst', 'reload schema'); 