-- 22-fix-content-storage-schema.sql
-- Comprehensive fix for content storage and retrieval issues
-- This script addresses payload structure mismatches and adds missing columns

-- First, let's add missing columns for better content management
ALTER TABLE public.topic_content_entries
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

-- Add composite index for better student content retrieval performance
CREATE INDEX IF NOT EXISTS idx_tce_student_content ON public.topic_content_entries(
  category, status, grade_level, topic_id, created_at DESC
) WHERE status = 'published' AND deleted_at IS NULL;

-- Fix the generated columns to match our actual payload structure
-- Drop existing generated columns if they exist
ALTER TABLE public.topic_content_entries 
  DROP COLUMN IF EXISTS preview_text,
  DROP COLUMN IF EXISTS detail_text,
  DROP COLUMN IF EXISTS source_text;

-- Add new generated columns that match our actual payload structures
-- For DISCOVERY content (Fun Facts and Info)
ALTER TABLE public.topic_content_entries
  ADD COLUMN preview_text TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN category = 'DISCOVERY' AND subtype = 'FACT' THEN 
        COALESCE(payload->>'fact', payload->>'statement', payload->>'text', title)
      WHEN category = 'DISCOVERY' AND subtype = 'INFO' THEN 
        CASE 
          WHEN payload->'sections' IS NOT NULL AND jsonb_array_length(payload->'sections') > 0 THEN
            COALESCE((payload->'sections'->0)->>'title', (payload->'sections'->0)->>'content', title)
          ELSE title
        END
      WHEN category = 'ARCADE' THEN
        COALESCE(payload->>'description', title)
      ELSE title
    END
  ) STORED,
  
  ADD COLUMN detail_text TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN category = 'DISCOVERY' AND subtype = 'FACT' THEN 
        COALESCE(payload->>'explanation', payload->>'detailed_explanation', payload->>'detail')
      WHEN category = 'DISCOVERY' AND subtype = 'INFO' THEN 
        CASE 
          WHEN payload->'sections' IS NOT NULL AND jsonb_array_length(payload->'sections') > 0 THEN
            -- Concatenate all section content for INFO types
            (
              SELECT string_agg(COALESCE(section->>'content', ''), ' ')
              FROM jsonb_array_elements(payload->'sections') AS section
              WHERE COALESCE(section->>'content', '') != ''
            )
          ELSE NULL
        END
      WHEN category = 'ARCADE' AND subtype = 'QUIZ' THEN
        CONCAT('Quiz with ', COALESCE(jsonb_array_length(payload->'questions'), 0)::text, ' questions')
      WHEN category = 'ARCADE' AND subtype = 'GAME' THEN
        CASE 
          WHEN payload->>'gameType' = 'memory' OR payload ? 'pairs' THEN
            CONCAT('Memory game with ', COALESCE(payload->>'pairCount', '0'), ' pairs')
          WHEN payload ? 'words' THEN
            CONCAT('Word game with ', COALESCE(jsonb_array_length(payload->'words'), 0)::text, ' words')
          ELSE 'Interactive game'
        END
      ELSE ''
    END
  ) STORED,
  
  ADD COLUMN source_text TEXT GENERATED ALWAYS AS (
    COALESCE(payload->>'source', payload->>'reference', '')
  ) STORED;

-- Add content-specific indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_tce_preview_text_trgm
  ON public.topic_content_entries USING GIN (preview_text gin_trgm_ops)
  WHERE preview_text IS NOT NULL AND preview_text != '';

CREATE INDEX IF NOT EXISTS idx_tce_detail_text_trgm
  ON public.topic_content_entries USING GIN (detail_text gin_trgm_ops)
  WHERE detail_text IS NOT NULL AND detail_text != '';

-- Add index for arcade game content retrieval
CREATE INDEX IF NOT EXISTS idx_tce_arcade_games ON public.topic_content_entries(
  topic_id, subtype, grade_level, difficulty, status
) WHERE category = 'ARCADE' AND status = 'published' AND deleted_at IS NULL;

-- Add index for discovery content retrieval
CREATE INDEX IF NOT EXISTS idx_tce_discovery_content ON public.topic_content_entries(
  topic_id, subtype, grade_level, status, created_at DESC
) WHERE category = 'DISCOVERY' AND status = 'published' AND deleted_at IS NULL;

-- Update the RLS policies to handle soft deletes
DROP POLICY IF EXISTS tce_select_published ON public.topic_content_entries;
CREATE POLICY tce_select_published ON public.topic_content_entries
  FOR SELECT USING (
    deleted_at IS NULL AND (
      (status = 'published' AND (
        grade_level IS NULL OR  -- Content without grade restriction 
        grade_level = (SELECT grade_level FROM public.profiles WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('TEACHER','ADMIN','DEVELOPER'))
      )) OR 
      (auth.uid() = created_by) -- Creators can always see their own content
    )
  );

-- Update admin policy to handle soft deletes
DROP POLICY IF EXISTS tce_select_admin_all ON public.topic_content_entries;
CREATE POLICY tce_select_admin_all ON public.topic_content_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('TEACHER','ADMIN','DEVELOPER')
    )
  );

-- Create/Update views for better content management
DROP VIEW IF EXISTS public.admin_discovery_facts CASCADE;
CREATE VIEW public.admin_discovery_facts AS
SELECT tce.id,
       tce.topic_id,
       tp.title AS topic_title,
       tp.grade_level AS topic_grade_level,
       tce.grade_level,
       tce.title,
       tce.subtype,
       tce.preview_text,
       tce.detail_text,
       tce.source_text,
       tce.status,
       tce.difficulty,
       tce.created_by,
       tce.ai_generated,
       tce.created_at,
       tce.updated_at,
       tce.deleted_at,
       tce.payload
FROM public.topic_content_entries tce
JOIN public.topics tp ON tp.id = tce.topic_id
WHERE tce.category = 'DISCOVERY' AND tce.deleted_at IS NULL;

DROP VIEW IF EXISTS public.admin_arcade_entries CASCADE;
CREATE VIEW public.admin_arcade_entries AS
SELECT tce.id,
       tce.topic_id,
       tp.title AS topic_title,
       tp.grade_level AS topic_grade_level,
       tce.grade_level,
       tce.subtype,
       tce.title,
       tce.detail_text,
       tce.status,
       tce.difficulty,
       tce.created_by,
       tce.ai_generated,
       tce.created_at,
       tce.updated_at,
       tce.deleted_at,
       tce.payload
FROM public.topic_content_entries tce
JOIN public.topics tp ON tp.id = tce.topic_id
WHERE tce.category = 'ARCADE' AND tce.deleted_at IS NULL;

-- Create student-facing views for optimized content retrieval
DROP VIEW IF EXISTS public.student_arcade_games CASCADE;
CREATE VIEW public.student_arcade_games AS
SELECT tce.id,
       tce.topic_id,
       tp.title AS topic_title,
       tp.study_area_id,
       sa.name AS study_area_name,
       tce.subtype,
       tce.title,
       tce.detail_text,
       tce.difficulty,
       tce.grade_level,
       tce.payload,
       tce.created_at
FROM public.topic_content_entries tce
JOIN public.topics tp ON tp.id = tce.topic_id
JOIN public.study_areas sa ON sa.id = tp.study_area_id
WHERE tce.category = 'ARCADE' 
  AND tce.status = 'published' 
  AND tce.deleted_at IS NULL;

DROP VIEW IF EXISTS public.student_discovery_content CASCADE;
CREATE VIEW public.student_discovery_content AS
SELECT tce.id,
       tce.topic_id,
       tp.title AS topic_title,
       tp.study_area_id,
       sa.name AS study_area_name,
       tce.subtype,
       tce.title,
       tce.preview_text,
       tce.detail_text,
       tce.source_text,
       tce.grade_level,
       tce.payload,
       tce.created_at
FROM public.topic_content_entries tce
JOIN public.topics tp ON tp.id = tce.topic_id
JOIN public.study_areas sa ON sa.id = tp.study_area_id
WHERE tce.category = 'DISCOVERY' 
  AND tce.status = 'published' 
  AND tce.deleted_at IS NULL;

-- Grant appropriate permissions
GRANT SELECT ON public.admin_discovery_facts TO authenticated;
GRANT SELECT ON public.admin_arcade_entries TO authenticated;
GRANT SELECT ON public.student_arcade_games TO authenticated;
GRANT SELECT ON public.student_discovery_content TO authenticated;

-- Add helpful comments
COMMENT ON COLUMN public.topic_content_entries.preview_text IS 'Generated column: Preview text extracted from payload based on content type';
COMMENT ON COLUMN public.topic_content_entries.detail_text IS 'Generated column: Detail text extracted from payload based on content type';
COMMENT ON COLUMN public.topic_content_entries.source_text IS 'Generated column: Source/reference information extracted from payload';
COMMENT ON COLUMN public.topic_content_entries.deleted_at IS 'Soft delete timestamp - NULL means not deleted';

COMMENT ON VIEW public.student_arcade_games IS 'Student-facing view for published arcade games with optimized columns';
COMMENT ON VIEW public.student_discovery_content IS 'Student-facing view for published discovery content with optimized columns';

-- Success message
SELECT 'Content storage schema enhanced successfully! Added soft deletes, optimized generated columns, and student-facing views.' as status;