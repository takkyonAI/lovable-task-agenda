-- DEBUG: Verificar políticas RLS atuais e diagnosticar problema
-- Date: 2025-01-08

-- Step 1: Verificar políticas RLS atualmente ativas
SELECT 'CURRENT RLS POLICIES:' as info;
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual as policy_condition
FROM pg_policies 
WHERE tablename = 'tasks' AND schemaname = 'public'
ORDER BY policyname;

-- Step 2: Verificar se RLS está habilitado
SELECT 'RLS STATUS:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'tasks' AND schemaname = 'public';

-- Step 3: Listar todas as assessoras ADM
SELECT 'ALL ASSESSORA ADM USERS:' as info;
SELECT 
    user_id,
    name,
    email,
    role,
    is_active
FROM public.user_profiles 
WHERE role = 'assessora_adm'
ORDER BY name;

-- Step 4: Listar todas as tarefas criadas por assessoras ADM
SELECT 'ALL TASKS CREATED BY ASSESSORA ADM:' as info;
SELECT 
    t.id,
    t.title,
    t.status,
    t.created_by,
    up.name as creator_name,
    up.role as creator_role,
    t.created_at
FROM public.tasks t
JOIN public.user_profiles up ON t.created_by = up.user_id
WHERE up.role = 'assessora_adm'
ORDER BY t.created_at DESC;

-- Step 5: Testar política específica para assessora ADM
SELECT 'TESTING ASSESSORA ADM POLICY:' as info;
SELECT 
    'Policy Test' as test_type,
    t.id,
    t.title,
    t.created_by,
    up.name as creator_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.user_profiles up_current
            WHERE up_current.user_id = auth.uid() AND up_current.role = 'assessora_adm'
        ) THEN 'Current user is assessora_adm'
        ELSE 'Current user is NOT assessora_adm'
    END as current_user_check,
    CASE 
        WHEN t.created_by IN (
            SELECT user_id FROM public.user_profiles 
            WHERE role = 'assessora_adm' AND is_active = true
        ) THEN 'Task created by assessora_adm'
        ELSE 'Task NOT created by assessora_adm'
    END as creator_check
FROM public.tasks t
JOIN public.user_profiles up ON t.created_by = up.user_id
WHERE up.role = 'assessora_adm'
ORDER BY t.created_at DESC;

-- Step 6: Verificar função get_visible_users_for_role
SELECT 'FUNCTION TEST:' as info;
SELECT * FROM public.get_visible_users_for_role('assessora_adm');

-- Step 7: Diagnóstico final
SELECT 'DIAGNOSIS:' as info;
SELECT 
    'If assessora ADM sees only 2 tasks but there are more tasks created by assessoras, then RLS policy is not working correctly' as diagnosis; 