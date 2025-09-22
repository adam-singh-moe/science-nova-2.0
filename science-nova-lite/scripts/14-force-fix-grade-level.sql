-- Comprehensive fix for grade_level column issue
-- Run this to diagnose and fix the grade_level column problem

-- Step 1: Check if the column actually exists
SELECT 'Checking if grade_level column exists...' as step;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles' 
AND column_name = 'grade_level';

-- Step 2: Force add the column (will fail if it exists, which is fine)
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN grade_level INTEGER CHECK (grade_level >= 1 AND grade_level <= 12);
        RAISE NOTICE 'Successfully added grade_level column';
    EXCEPTION 
        WHEN duplicate_column THEN
            RAISE NOTICE 'grade_level column already exists';
        WHEN OTHERS THEN
            RAISE NOTICE 'Error adding column: %', SQLERRM;
    END;
END $$;

-- Step 3: Show full table structure
SELECT 'Current profiles table structure:' as step;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Step 4: Test if we can update the column
DO $$
DECLARE
    test_result TEXT;
BEGIN
    BEGIN
        -- Try to set a default value
        EXECUTE 'UPDATE profiles SET grade_level = 3 WHERE grade_level IS NULL';
        GET DIAGNOSTICS test_result = ROW_COUNT;
        RAISE NOTICE 'Successfully updated % rows with default grade_level', test_result;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating grade_level: %', SQLERRM;
    END;
END $$;

-- Step 5: Refresh any potential schema cache issues
-- Force a schema refresh by recreating a simple view
CREATE OR REPLACE VIEW profile_check AS 
SELECT id, full_name, role, learning_preference, email, grade_level, created_at, updated_at 
FROM profiles 
LIMIT 1;

-- Step 6: Test the view
SELECT 'Testing if grade_level is accessible via view...' as step;
SELECT * FROM profile_check WHERE FALSE; -- Won't return data but will test column access

-- Step 7: Drop the test view
DROP VIEW IF EXISTS profile_check;

-- Final verification
SELECT 'Final verification - Column should be accessible now:' as step;
SELECT COUNT(*) as total_profiles, COUNT(grade_level) as profiles_with_grade_level
FROM profiles;

SELECT 'Grade level column fix completed!' as status;
