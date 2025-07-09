-- FIX: Adicionar coluna is_private na tabela tasks para resolver problema da Vanessa
-- Data: 07/01/2025
-- Erro: PGRST204 - Could not find the 'is_private' column

-- Adicionar coluna is_private se não existir
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;

-- Adicionar comentário
COMMENT ON COLUMN public.tasks.is_private IS 'Indica se a tarefa é privada';

-- Notificar PostgREST para recarregar schema
SELECT pg_notify('pgrst', 'reload schema');

-- Verificar se foi adicionada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tasks'
  AND column_name = 'is_private'; 