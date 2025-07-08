-- Migration: Diagnose and clean orphaned users in auth.users without corresponding user_profiles
-- This will identify and remove users that exist in auth.users but not in user_profiles

-- First, let's see what orphaned users exist in auth.users
DO $$
DECLARE
    orphan_record RECORD;
    orphan_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting diagnosis of orphaned users...';
    
    -- Count and list orphaned auth users
    FOR orphan_record IN 
        SELECT au.email, au.id, au.created_at 
        FROM auth.users au 
        LEFT JOIN public.user_profiles up ON au.id = up.user_id 
        WHERE up.user_id IS NULL
        ORDER BY au.created_at DESC
    LOOP
        orphan_count := orphan_count + 1;
        RAISE NOTICE 'Orphaned user found: email=%, id=%, created_at=%', 
            orphan_record.email, orphan_record.id, orphan_record.created_at;
    END LOOP;
    
    RAISE NOTICE 'Total orphaned users found: %', orphan_count;
    
    -- Show current state before cleanup
    RAISE NOTICE 'Current state:';
    RAISE NOTICE 'Auth users count: %', (SELECT COUNT(*) FROM auth.users);
    RAISE NOTICE 'User profiles count: %', (SELECT COUNT(*) FROM public.user_profiles);
END $$;

-- Clean up orphaned auth users (except protected admin emails)
DELETE FROM auth.users 
WHERE id IN (
    SELECT au.id 
    FROM auth.users au 
    LEFT JOIN public.user_profiles up ON au.id = up.user_id 
    WHERE up.user_id IS NULL 
    AND au.email NOT IN (
        'wadevenga@hotmail.com',
        'admin@rockfellerbrasil.com.br'
    ) -- Protect admin users
);

-- Also clean up any profiles without corresponding auth users (reverse orphans)
DELETE FROM public.user_profiles 
WHERE user_id NOT IN (
    SELECT id FROM auth.users
);

-- Show final state
DO $$
BEGIN
    RAISE NOTICE 'Final state after cleanup:';
    RAISE NOTICE 'Auth users count: %', (SELECT COUNT(*) FROM auth.users);
    RAISE NOTICE 'User profiles count: %', (SELECT COUNT(*) FROM public.user_profiles);
    
    RAISE NOTICE 'Remaining users:';
    PERFORM 
        RAISE NOTICE 'User: email=%, name=%, role=%', 
            up.email, up.name, up.role
    FROM public.user_profiles up
    ORDER BY up.created_at;
END $$; 