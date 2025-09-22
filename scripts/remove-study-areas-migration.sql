-- Migration script to remove study areas from Science Nova Lite
-- This simplifies the platform to focus solely on science education

-- Step 1: Remove the foreign key constraint from topics table
ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_study_area_id_fkey;

-- Step 2: Remove the study_area_id column from topics table
ALTER TABLE topics DROP COLUMN IF EXISTS study_area_id;

-- Step 3: Remove foreign key constraint from textbook_content table
ALTER TABLE textbook_content DROP CONSTRAINT IF EXISTS textbook_content_study_area_id_fkey;

-- Step 4: Remove the study_area_id column from textbook_content table
ALTER TABLE textbook_content DROP COLUMN IF EXISTS study_area_id;

-- Step 5: Drop the study_areas table completely
DROP TABLE IF EXISTS study_areas CASCADE;

-- Step 6: Update textbook_content table structure to focus on topics instead
-- Add topic references if not already present
ALTER TABLE textbook_content 
ADD COLUMN IF NOT EXISTS topic_title TEXT;

-- Create an index on the new topic_title column for better performance
CREATE INDEX IF NOT EXISTS idx_textbook_content_topic_title ON textbook_content(topic_title);
CREATE INDEX IF NOT EXISTS idx_textbook_content_grade_level ON textbook_content(grade_level);

-- Update any existing triggers
DROP TRIGGER IF EXISTS update_study_areas_modtime ON study_areas;

-- Add comments to document the changes
COMMENT ON TABLE topics IS 'Educational topics focused on science learning for grades 1-6';
COMMENT ON TABLE textbook_content IS 'Reference materials for science topics by grade level';

-- Create a function to check if migration was successful
CREATE OR REPLACE FUNCTION check_study_areas_removal()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if study_areas table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'study_areas') THEN
        RETURN FALSE;
    END IF;
    
    -- Check if study_area_id column exists in topics
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'topics' AND column_name = 'study_area_id') THEN
        RETURN FALSE;
    END IF;
    
    -- Check if study_area_id column exists in textbook_content
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'textbook_content' AND column_name = 'study_area_id') THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Display migration status
SELECT 
    CASE 
        WHEN check_study_areas_removal() THEN 'SUCCESS: Study areas have been successfully removed from the database schema'
        ELSE 'PENDING: Study areas migration has not been completed'
    END as migration_status;