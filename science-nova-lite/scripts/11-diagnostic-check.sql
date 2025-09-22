-- Diagnostic script to check database setup
-- Run this to verify everything is working correctly

-- Check if extensions are enabled
SELECT 
    'Extensions Check' as check_type,
    string_agg(extname, ', ') as enabled_extensions
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'vector', 'pgcrypto', 'pg_trgm');

-- Check if enum types exist
SELECT 
    'Enum Types Check' as check_type,
    string_agg(typname, ', ') as enum_types
FROM pg_type 
WHERE typname IN ('user_role', 'learning_preference');

-- Check if tables exist
SELECT 
    'Tables Check' as check_type,
    string_agg(tablename, ', ') as existing_tables
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'study_areas', 'topics', 'lessons', 'user_progress');

-- Check if the profile trigger function exists
SELECT 
    'Trigger Function Check' as check_type,
    CASE WHEN COUNT(*) > 0 THEN 'handle_new_user function exists' ELSE 'handle_new_user function missing' END as status
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Check if the trigger exists
SELECT 
    'Trigger Check' as check_type,
    CASE WHEN COUNT(*) > 0 THEN 'on_auth_user_created trigger exists' ELSE 'on_auth_user_created trigger missing' END as status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Check RLS status
SELECT 
    'RLS Check' as check_type,
    tablename,
    CASE WHEN rowsecurity THEN 'Enabled' ELSE 'Disabled' END as rls_status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public' 
AND t.tablename IN ('profiles', 'lessons', 'user_progress')
ORDER BY t.tablename;
