-- Final comprehensive database verification script
-- This will show you exactly what's in your database and verify everything is working

\echo '=== COMPREHENSIVE DATABASE STATUS CHECK ==='

-- Check 1: Verify the profiles table structure
\echo 'Check 1: Profiles table structure...'
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Check 2: Verify enum types exist
\echo 'Check 2: Enum types...'
SELECT typname, enumlabel 
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE typname IN ('user_role', 'learning_preference')
ORDER BY typname, enumlabel;

-- Check 3: Check if grade_level column specifically exists
\echo 'Check 3: Grade level column existence...'
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'grade_level'
) as grade_level_column_exists;

-- Check 4: Check profiles table permissions
\echo 'Check 4: Table permissions...'
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.table_privileges 
WHERE table_name = 'profiles';

-- Check 5: Check RLS policies on profiles
\echo 'Check 5: RLS policies...'
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Check 6: Test profile insertion with grade_level
\echo 'Check 6: Test profile creation...'
BEGIN;
    INSERT INTO profiles (
        id, 
        full_name, 
        role, 
        learning_preference, 
        email, 
        grade_level,
        created_at,
        updated_at
    ) VALUES (
        '11111111-2222-3333-4444-555555555555'::UUID,
        'Test Grade Level User',
        'STUDENT'::user_role,
        'VISUAL'::learning_preference,
        'test-db-grade@example.com',
        4,
        NOW(),
        NOW()
    );
    
    -- Verify the insertion worked
    SELECT 'Insertion successful - grade_level value:' as test, grade_level 
    FROM profiles 
    WHERE email = 'test-db-grade@example.com';
    
    -- Clean up
    DELETE FROM profiles WHERE email = 'test-db-grade@example.com';
ROLLBACK;

-- Check 7: Check if there are any existing profiles
\echo 'Check 7: Existing profiles count...'
SELECT COUNT(*) as total_profiles FROM profiles;

-- Check 8: Show sample of existing profiles (if any)
\echo 'Check 8: Sample profiles (showing grade_level)...'
SELECT 
    id, 
    full_name, 
    email, 
    role, 
    grade_level,
    created_at
FROM profiles 
LIMIT 5;

\echo '=== DATABASE CHECK COMPLETE ==='
\echo 'If you see no errors above, the database is properly configured.'
\echo 'Next steps:'
\echo '1. Make sure your development server is restarted'
\echo '2. Clear your browser cache/cookies for localhost'
\echo '3. Try creating a new user account'
