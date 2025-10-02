-- Add grade_level column to topic_content_entries table for proper content filtering by student grade
-- This enables the application to show only grade-appropriate content to students

-- Add grade_level column with constraints for grades 1-6 (elementary focus)
DO $$ 
BEGIN
    -- Check if column already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'topic_content_entries' 
        AND column_name = 'grade_level'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.topic_content_entries 
        ADD COLUMN grade_level INTEGER CHECK (grade_level >= 1 AND grade_level <= 6);
        
        RAISE NOTICE 'Added grade_level column to topic_content_entries table';
    ELSE
        RAISE NOTICE 'grade_level column already exists in topic_content_entries table';
    END IF;
    
    -- Add index for efficient filtering by grade level
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'topic_content_entries' 
        AND indexname = 'idx_tce_grade_level_status'
    ) THEN
        CREATE INDEX idx_tce_grade_level_status ON public.topic_content_entries(grade_level, status) 
        WHERE status = 'published';
        
        RAISE NOTICE 'Created index idx_tce_grade_level_status for efficient grade filtering';
    ELSE
        RAISE NOTICE 'Index idx_tce_grade_level_status already exists';
    END IF;
    
    -- Add composite index for topic + grade filtering
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'topic_content_entries' 
        AND indexname = 'idx_tce_topic_grade_category'
    ) THEN
        CREATE INDEX idx_tce_topic_grade_category ON public.topic_content_entries(topic_id, grade_level, category, status) 
        WHERE status = 'published';
        
        RAISE NOTICE 'Created index idx_tce_topic_grade_category for efficient topic+grade filtering';
    ELSE
        RAISE NOTICE 'Index idx_tce_topic_grade_category already exists';
    END IF;
    
END $$;

-- Update RLS policies to consider grade level
-- Drop existing select policy and recreate with grade level consideration
DROP POLICY IF EXISTS tce_select_published ON public.topic_content_entries;

-- Policy: Students can only see published content appropriate for their grade level
CREATE POLICY tce_select_published ON public.topic_content_entries
  FOR SELECT USING (
    (status = 'published' AND (
      grade_level IS NULL OR  -- Content without grade restriction 
      grade_level = (SELECT grade_level FROM public.profiles WHERE id = auth.uid()) OR
      EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('TEACHER','ADMIN','DEVELOPER'))
    )) OR 
    (auth.uid() = created_by) -- Creators can always see their own content
  );

-- Add comment to explain the grade_level column
COMMENT ON COLUMN public.topic_content_entries.grade_level IS 'Target grade level (1-6) for this content. NULL means appropriate for all grades.';

-- Verification query (commented out for safety)
-- SELECT grade_level, COUNT(*) as content_count 
-- FROM public.topic_content_entries 
-- WHERE grade_level IS NOT NULL
-- GROUP BY grade_level 
-- ORDER BY grade_level;

-- Show successful completion
SELECT 'Grade level migration completed successfully! Content can now be filtered by student grade levels.' as status;