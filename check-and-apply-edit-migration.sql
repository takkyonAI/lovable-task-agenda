-- Script para verificar e aplicar migração de edição de tarefas
-- Aplica apenas o que ainda não existe

-- Verificar se as colunas existem
DO $$
BEGIN
    -- Adicionar coluna edited_by se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name = 'edited_by'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.tasks ADD COLUMN edited_by UUID REFERENCES public.user_profiles(user_id);
        RAISE NOTICE 'Coluna edited_by criada';
    ELSE
        RAISE NOTICE 'Coluna edited_by já existe';
    END IF;

    -- Adicionar coluna edited_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name = 'edited_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.tasks ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Coluna edited_at criada';
    ELSE
        RAISE NOTICE 'Coluna edited_at já existe';
    END IF;
END $$;

-- Adicionar comentários às colunas
COMMENT ON COLUMN public.tasks.edited_by IS 'User who last edited this task';
COMMENT ON COLUMN public.tasks.edited_at IS 'Timestamp when task was last edited';

-- Verificar e criar função se não existir
DO $$
BEGIN
    -- Criar ou substituir função de tracking
    CREATE OR REPLACE FUNCTION public.update_task_edit_tracking()
    RETURNS TRIGGER AS $func$
    BEGIN
        -- Verificar se houve mudanças relevantes (não apenas status)
        IF OLD.title != NEW.title OR 
           OLD.description != NEW.description OR 
           OLD.priority != NEW.priority OR
           OLD.due_date != NEW.due_date OR
           OLD.assigned_users != NEW.assigned_users OR
           OLD.is_private != NEW.is_private THEN
            
            NEW.edited_by = auth.uid();
            NEW.edited_at = NOW();
        END IF;
        
        RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;
    
    RAISE NOTICE 'Função update_task_edit_tracking criada/atualizada';
END $$;

-- Verificar e criar trigger se não existir
DO $$
BEGIN
    -- Remover trigger se existir
    DROP TRIGGER IF EXISTS update_task_edit_tracking_trigger ON public.tasks;
    
    -- Criar trigger
    CREATE TRIGGER update_task_edit_tracking_trigger
        BEFORE UPDATE ON public.tasks
        FOR EACH ROW
        EXECUTE FUNCTION public.update_task_edit_tracking();
        
    RAISE NOTICE 'Trigger update_task_edit_tracking_trigger criado';
END $$;

-- Criar índices se não existirem
DO $$
BEGIN
    -- Índice para edited_by
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'tasks' 
        AND indexname = 'idx_tasks_edited_by'
    ) THEN
        CREATE INDEX idx_tasks_edited_by ON public.tasks(edited_by);
        RAISE NOTICE 'Índice idx_tasks_edited_by criado';
    ELSE
        RAISE NOTICE 'Índice idx_tasks_edited_by já existe';
    END IF;

    -- Índice para edited_at
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'tasks' 
        AND indexname = 'idx_tasks_edited_at'
    ) THEN
        CREATE INDEX idx_tasks_edited_at ON public.tasks(edited_at);
        RAISE NOTICE 'Índice idx_tasks_edited_at criado';
    ELSE
        RAISE NOTICE 'Índice idx_tasks_edited_at já existe';
    END IF;
END $$;

-- Garantir permissões
GRANT SELECT, UPDATE ON public.tasks TO authenticated;

-- Comentário na função
COMMENT ON FUNCTION public.update_task_edit_tracking() IS 'Automatically tracks who edited a task and when, excluding status-only changes';

-- Verificação final
SELECT 
    'edited_by' as column_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name = 'edited_by'
        AND table_schema = 'public'
    ) THEN 'EXISTS' ELSE 'NOT EXISTS' END as status
UNION ALL
SELECT 
    'edited_at' as column_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name = 'edited_at'
        AND table_schema = 'public'
    ) THEN 'EXISTS' ELSE 'NOT EXISTS' END as status
UNION ALL
SELECT 
    'function' as column_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'update_task_edit_tracking'
        AND routine_schema = 'public'
    ) THEN 'EXISTS' ELSE 'NOT EXISTS' END as status
UNION ALL
SELECT 
    'trigger' as column_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_task_edit_tracking_trigger'
        AND event_object_table = 'tasks'
    ) THEN 'EXISTS' ELSE 'NOT EXISTS' END as status; 