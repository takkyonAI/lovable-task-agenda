-- Migration: Clean specific email (wadevenga@gmail.com) from database
-- This will allow the user to register with this email again later

-- First, find and delete the user profile
DELETE FROM public.user_profiles 
WHERE email IN ('wadevenga@gmail.com', 'wadepvenga@gmail.com');

-- Then, delete from auth.users (this will cascade to user_profiles if any remain)
DELETE FROM auth.users 
WHERE email IN ('wadevenga@gmail.com', 'wadepvenga@gmail.com');

-- Show remaining users (for verification)
SELECT 'Remaining users:' as info, email, created_at 
FROM auth.users 
ORDER BY created_at; 