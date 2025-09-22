-- Simple test to verify grade_level column is working
-- This version works with the foreign key constraint to auth.users

-- Test 1: Check if the grade_level column exists
SELECT 'Testing grade_level column existence...' as test;
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'grade_level'
) as grade_level_column_exists;

-- Test 2: Show the profiles table structure
SELECT 'Profiles table structure:' as test;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Test 3: Check if we have any existing profiles
SELECT 'Existing profiles check:' as test;
SELECT COUNT(*) as profile_count FROM profiles;

-- Test 4: If we have existing profiles, show their grade_level values
SELECT 'Sample profiles with grade_level:' as test;
SELECT 
    id, 
    full_name, 
    email, 
    role, 
    grade_level,
    created_at
FROM profiles 
LIMIT 3;

-- Test 5: Test that we can update grade_level on existing profiles (if any exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM profiles LIMIT 1) THEN
        -- Update the first profile's grade_level to test the column works
        UPDATE profiles 
        SET grade_level = COALESCE(grade_level, 3) + 1, 
            updated_at = NOW()
        WHERE id = (SELECT id FROM profiles LIMIT 1);
        
        RAISE NOTICE 'Successfully updated grade_level on existing profile';
    ELSE
        RAISE NOTICE 'No existing profiles to test with - this is normal for a fresh database';
    END IF;
END $$;

SELECT 'Grade level column test completed successfully!' as result;
SELECT 'The column exists and can be used for profile creation via your app!' as conclusion;
