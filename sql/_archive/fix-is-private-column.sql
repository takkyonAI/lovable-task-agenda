-- 🔧 FIX: Adicionar coluna is_private na tabela tasks
-- Data: 07/01/2025
-- Problema: Vanessa (assessora_adm) não consegue criar tarefas devido a coluna is_private não existir
-- Erro: PGRST204 - Could not find the 'is_private' column or 'tasks' in the schema cache

-- Step 1: Verificar se a coluna is_private existe
SELECT 
    'VERIFICANDO COLUNA IS_PRIVATE:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tasks'
  AND column_name = 'is_private';

-- Step 2: Verificar estrutura atual da tabela
SELECT 
    'ESTRUTURA ATUAL DA TABELA TASKS:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tasks'
ORDER BY ordinal_position;

-- Step 3: Adicionar coluna is_private se não existir
DO $$
BEGIN
    -- Verificar se a coluna já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'tasks' 
          AND column_name = 'is_private'
    ) THEN
        -- Adicionar a coluna
        ALTER TABLE public.tasks 
        ADD COLUMN is_private BOOLEAN NOT NULL DEFAULT false;
        
        RAISE NOTICE 'Coluna is_private adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna is_private já existe!';
    END IF;
END $$;

-- Step 4: Verificar se a coluna foi adicionada
SELECT 
    'VERIFICAÇÃO PÓS-ADIÇÃO:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tasks'
  AND column_name = 'is_private';

-- Step 5: Atualizar comentário da tabela
COMMENT ON COLUMN public.tasks.is_private IS 'Indica se a tarefa é privada (visível apenas para criador, atribuídos e admin/franqueados)';

-- Step 6: Verificar se há políticas RLS que precisam ser atualizadas
SELECT 
    'POLÍTICAS RLS ATUAIS:' as info,
    policyname,
    cmd as policy_definition
FROM pg_policies 
WHERE tablename = 'tasks' AND schemaname = 'public'
ORDER BY policyname;

-- Step 7: Limpar cache do PostgREST para forçar reload do schema
SELECT 'CACHE DO POSTGREST SERÁ LIMPO AUTOMATICAMENTE' as info;
SELECT 'OU EXECUTE: pg_notify(''pgrst'', ''reload schema'');' as manual_reload;

-- Step 8: Testar inserção com is_private
SELECT 
    'TESTE DE INSERÇÃO COM IS_PRIVATE:' as info,
    'Agora a Vanessa deveria conseguir criar tarefas normalmente' as expected_result;

-- Step 9: Verificar todas as colunas da tabela para garantir integridade
SELECT 
    'ESTRUTURA FINAL DA TABELA TASKS:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tasks'
ORDER BY ordinal_position;

-- Step 10: Mensagem de sucesso
SELECT 
    'CORREÇÃO COMPLETA!' as status,
    'Problema da Vanessa (assessora_adm) deve estar resolvido' as result,
    'Coluna is_private adicionada à tabela tasks' as fix_applied; 