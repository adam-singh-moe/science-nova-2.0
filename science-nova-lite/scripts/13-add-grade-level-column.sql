-- Add missing grade_level column to profiles table
-- Run this to fix the "grade_level column not found" error

-- Check current profiles table structure
SELECT 'Current profiles table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add grade_level column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND table_schema = 'public'
        AND column_name = 'grade_level'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN grade_level INTEGER CHECK (grade_level >= 1 AND grade_level <= 12);
        RAISE NOTICE 'Added grade_level column to profiles table';
    ELSE
        RAISE NOTICE 'grade_level column already exists in profiles table';
    END IF;
END $$;

-- Update the handle_new_user function to include grade_level
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, full_name, role, learning_preference, email, grade_level, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'STUDENT'::user_role,
        'VISUAL'::learning_preference,
        NEW.email,
        3, -- Default to grade 3
        NOW(),
        NOW()
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Profile already exists, do nothing
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log the error and return NEW to allow user creation to continue
        RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Show updated table structure
SELECT 'Updated profiles table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Grade level column added successfully!' as status;
