-- Add grade_level column to topic_content_entries table
-- This column will store the grade level (1-12) for each content entry
-- Allows for proper grade-level filtering in the discovery and arcade managers

ALTER TABLE topic_content_entries 
ADD COLUMN grade_level INTEGER;

-- Optional: Add a check constraint to ensure grade_level is between 1 and 12 when not null
-- ALTER TABLE topic_content_entries 
-- ADD CONSTRAINT check_grade_level CHECK (grade_level IS NULL OR (grade_level >= 1 AND grade_level <= 12));