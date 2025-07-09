-- Simple Real-time Configuration Check
-- Run this in your Supabase SQL editor

-- 1. Check if tasks table exists in realtime publication
SELECT 
    'tasks table in realtime publication' as check_description,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND tablename = 'tasks'
        ) THEN '✅ YES - Table is published for realtime'
        ELSE '❌ NO - Table is NOT published for realtime'
    END as status;

-- 2. Check if realtime extension is installed
SELECT 
    'realtime extension' as check_description,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_extension WHERE extname = 'supabase_realtime'
        ) THEN '✅ YES - Realtime extension is installed'
        ELSE '❌ NO - Realtime extension is NOT installed'
    END as status;

-- 3. Check if tasks table has RLS enabled
SELECT 
    'tasks table RLS status' as check_description,
    CASE 
        WHEN relrowsecurity = true THEN '✅ YES - RLS is enabled'
        ELSE '❌ NO - RLS is disabled'
    END as status
FROM pg_class 
WHERE relname = 'tasks' AND relkind = 'r';

-- 4. Simple tasks table info
SELECT 
    'tasks table basic info' as check_description,
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename = 'tasks';

-- 5. Check current publication tables
SELECT 
    'all realtime tables' as check_description,
    schemaname,
    tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename; 