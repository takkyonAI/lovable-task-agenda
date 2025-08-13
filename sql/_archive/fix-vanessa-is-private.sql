-- FIX: Adicionar coluna is_private na tabela tasks
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.tasks.is_private IS 'Indica se a tarefa é privada';

SELECT pg_notify('pgrst', 'reload schema');

SELECT 'SUCESSO: Coluna is_private adicionada!' as result;
