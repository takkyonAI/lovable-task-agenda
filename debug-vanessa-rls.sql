-- 🔍 DEBUG: Verificação RLS para Usuária Vanessa (assessora_adm)
-- Data: 07/01/2025
-- Problema: Vanessa não consegue criar tarefas

-- Step 1: Verificar políticas RLS atuais na tabela tasks
SELECT 
    'POLÍTICAS RLS ATUAIS:' as info,
    policyname,
    cmd as policy_definition,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'tasks' AND schemaname = 'public'
ORDER BY policyname;

-- Step 2: Verificar se RLS está habilitado
SELECT 
    'RLS STATUS:' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'tasks' AND schemaname = 'public';

-- Step 3: Verificar perfil da usuária Vanessa
SELECT 
    'PERFIL DA VANESSA:' as info,
    user_id,
    name,
    email,
    role,
    is_active,
    created_at,
    first_login_completed
FROM public.user_profiles 
WHERE LOWER(name) LIKE '%vanessa%' 
   OR LOWER(email) LIKE '%vanessa%';

-- Step 4: Verificar todas as assessoras ADM no sistema
SELECT 
    'TODAS AS ASSESSORAS ADM:' as info,
    user_id,
    name,
    email,
    role,
    is_active
FROM public.user_profiles 
WHERE role = 'assessora_adm'
ORDER BY name;

-- Step 5: Verificar se há alguma tarefa criada por assessoras ADM
SELECT 
    'TAREFAS CRIADAS POR ASSESSORAS ADM:' as info,
    COUNT(*) as total_tasks,
    COUNT(DISTINCT t.created_by) as unique_creators
FROM public.tasks t
JOIN public.user_profiles up ON t.created_by = up.user_id
WHERE up.role = 'assessora_adm';

-- Step 6: Testar política INSERT simulada
-- Esta query simula o que aconteceria se uma assessora ADM tentasse criar uma tarefa
SELECT 
    'TESTE DE POLÍTICA INSERT:' as info,
    'Esta query testa se a política INSERT permitiria uma assessora ADM criar tarefas' as description;

-- Simular um INSERT para verificar se a política bloquearia
-- Nota: Esta query não executa INSERT real, apenas mostra como seria avaliada
SELECT 
    'SIMULAÇÃO INSERT POLICY:' as test,
    user_id,
    name,
    role,
    CASE 
        WHEN user_id IS NOT NULL THEN 'PERMITIDO: auth.uid() = created_by seria TRUE'
        ELSE 'BLOQUEADO: auth.uid() = created_by seria FALSE'
    END as policy_result
FROM public.user_profiles
WHERE role = 'assessora_adm' AND LOWER(name) LIKE '%vanessa%';

-- Step 7: Verificar se há conflitos entre políticas
SELECT 
    'ANÁLISE DE CONFLITOS:' as info,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN cmd LIKE '%INSERT%' THEN 1 END) as insert_policies,
    COUNT(CASE WHEN cmd LIKE '%SELECT%' THEN 1 END) as select_policies
FROM pg_policies 
WHERE tablename = 'tasks' AND schemaname = 'public';

-- Step 8: Mostrar estrutura da tabela tasks
SELECT 
    'ESTRUTURA DA TABELA TASKS:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tasks'
ORDER BY ordinal_position;

-- Step 9: Verificar se há triggers que podem interferir
SELECT 
    'TRIGGERS NA TABELA TASKS:' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'tasks' 
  AND trigger_schema = 'public';

-- Step 10: Sugestões de correção
SELECT 
    'SUGESTÕES DE CORREÇÃO:' as info,
    'Se a política INSERT não existe ou está incorreta, execute:' as suggestion1,
    'DROP POLICY IF EXISTS "tasks_insert_policy" ON public.tasks;' as sql1,
    'CREATE POLICY "tasks_insert_policy" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = created_by);' as sql2,
    'Se o problema persistir, verificar se auth.uid() está retornando o ID correto' as suggestion2;

-- Step 11: Verificar logs de erro (se disponíveis)
SELECT 
    'PRÓXIMOS PASSOS:' as info,
    '1. Executar este script completo' as step1,
    '2. Pedir para Vanessa abrir o console do navegador' as step2,
    '3. Pedir para ela tentar criar uma tarefa' as step3,
    '4. Verificar logs que começam com "🔍 DEBUG createTask"' as step4,
    '5. Comparar session_user_id com user_id do perfil' as step5; 