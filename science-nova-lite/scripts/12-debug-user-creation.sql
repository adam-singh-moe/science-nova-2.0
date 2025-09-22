-- Debug user creation issues
-- Run this to test and troubleshoot user creation

-- First, let's check what happens when we try to manually create a profile
-- Replace 'test-user-id' with an actual UUID and 'test@example.com' with a test email

-- Test 1: Manual profile creation (use actual values)
-- INSERT INTO profiles (id, full_name, role, learning_preference, email, created_at, updated_at)
-- VALUES (
--     '00000000-0000-0000-0000-000000000001'::UUID,  -- Replace with actual user ID
--     'Test User',
--     'STUDENT'::user_role,
--     'VISUAL'::learning_preference,
--     'test@example.com',  -- Replace with actual email
--     NOW(),
--     NOW()
-- );

-- Test 2: Check if we can select from profiles table
SELECT 'Profile table accessible' as test, COUNT(*) as profile_count FROM profiles;

-- Test 3: Check enum values are working
SELECT 'STUDENT'::user_role as role_test, 'VISUAL'::learning_preference as pref_test;

-- Test 4: Check the trigger function exists and is properly defined
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Test 5: Check trigger exists on auth.users
SELECT 
    tgname as trigger_name,
    tgenabled as enabled,
    pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Test 6: Check if auth.users table exists and basic info
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'auth' AND tablename = 'users';

-- Test 7: Check if we can see any users in auth.users (if permissions allow)
SELECT 'Auth users check' as test, 
       CASE 
           WHEN COUNT(*) >= 0 THEN CONCAT('Can access auth.users table, ', COUNT(*)::text, ' users exist')
           ELSE 'Cannot access auth.users table'
       END as result
FROM auth.users;

-- If you're getting errors, this will help identify the issue
SELECT 'Diagnostic complete' as status;
