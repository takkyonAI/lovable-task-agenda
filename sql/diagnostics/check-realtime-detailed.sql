-- Check detailed real-time configuration
SELECT 
    'Real-time publication status' as check_type,
    schemaname,
    tablename,
    'Published' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename = 'tasks';

-- Check if realtime is enabled in the database
SELECT 
    'Real-time extension status' as check_type,
    extname,
    extversion
FROM pg_extension 
WHERE extname = 'supabase_realtime';

-- Check table permissions for realtime
SELECT 
    'Table permissions' as check_type,
    table_schema,
    table_name,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'tasks' 
AND grantee LIKE '%realtime%';

-- Check RLS policies that might affect realtime
SELECT 
    'RLS policies' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'tasks'
ORDER BY policyname;

-- Check current database settings
SELECT 
    'Database settings' as check_type,
    name,
    setting,
    short_desc
FROM pg_settings 
WHERE name LIKE '%realtime%' OR name LIKE '%wal%'; 