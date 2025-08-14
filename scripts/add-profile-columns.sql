-- Check profiles table structure and see if we need to add grade_level and updated_at columns
-- Note: \d is psql-specific, using standard SQL instead

-- Show current table structure first
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- If grade_level column doesn't exist, add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'grade_level'
    ) THEN
        ALTER TABLE profiles ADD COLUMN grade_level INTEGER CHECK (grade_level >= 1 AND grade_level <= 12);
        RAISE NOTICE 'Added grade_level column to profiles table';
    ELSE
        RAISE NOTICE 'grade_level column already exists in profiles table';
    END IF;
END $$;

-- If updated_at column doesn't exist, add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to profiles table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in profiles table';
    END IF;
END $$;
