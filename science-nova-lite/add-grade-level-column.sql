-- Add grade_level column to topic_content_entries table
-- This allows individual content entries to have their own grade level
-- separate from the topic's default grade level

ALTER TABLE topic_content_entries 
ADD COLUMN grade_level INTEGER;

-- Add an index for efficient filtering by grade level
CREATE INDEX IF NOT EXISTS idx_topic_content_entries_grade_level 
ON topic_content_entries(grade_level);

-- Add a check constraint to ensure grade_level is between 1 and 12
ALTER TABLE topic_content_entries 
ADD CONSTRAINT check_grade_level_range 
CHECK (grade_level IS NULL OR (grade_level >= 1 AND grade_level <= 12));

-- Update existing records to inherit grade level from their topic (optional)
-- This can be run after the column is added to populate existing content
UPDATE topic_content_entries 
SET grade_level = (
  SELECT topics.grade_level 
  FROM topics 
  WHERE topics.id = topic_content_entries.topic_id
)
WHERE grade_level IS NULL;