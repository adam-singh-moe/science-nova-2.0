-- 24-fix-arcade-subtypes-final.sql
-- Fixed version that handles PostgreSQL enum and dependency constraints properly

-- PART 1: Handle view dependencies first
-- Drop views that depend on the columns we need to modify
DROP VIEW IF EXISTS public.admin_discovery_facts CASCADE;
DROP VIEW IF EXISTS public.admin_arcade_entries CASCADE;
DROP VIEW IF EXISTS public.student_arcade_games CASCADE;
DROP VIEW IF EXISTS public.student_discovery_content CASCADE;

-- PART 2: Add new enum values (must be in separate transaction)
-- These need to be added first and committed before use
ALTER TYPE content_subtype ADD VALUE IF NOT EXISTS 'CROSSWORD';
COMMIT;

ALTER TYPE content_subtype ADD VALUE IF NOT EXISTS 'WORDSEARCH';
COMMIT;

ALTER TYPE content_subtype ADD VALUE IF NOT EXISTS 'MEMORY';
COMMIT;

-- PART 3: Update existing content to use specific subtypes
-- Now we can safely use the new enum values
UPDATE public.topic_content_entries 
SET subtype = CASE
  -- Memory games have 'pairs' in payload
  WHEN category = 'ARCADE' AND subtype = 'GAME' AND payload ? 'pairs' THEN 'MEMORY'::content_subtype
  -- Crosswords have 'clues' with 'across' and 'down' in payload  
  WHEN category = 'ARCADE' AND subtype = 'GAME' AND payload->'clues' ? 'across' THEN 'CROSSWORD'::content_subtype
  -- Word searches have 'words' array but not pairs
  WHEN category = 'ARCADE' AND subtype = 'GAME' AND payload ? 'words' AND NOT payload ? 'pairs' THEN 'WORDSEARCH'::content_subtype
  -- Check payload.type for additional detection
  WHEN category = 'ARCADE' AND subtype = 'GAME' AND payload->>'type' = 'crossword' THEN 'CROSSWORD'::content_subtype
  WHEN category = 'ARCADE' AND subtype = 'GAME' AND payload->>'type' = 'wordsearch' THEN 'WORDSEARCH'::content_subtype
  WHEN category = 'ARCADE' AND subtype = 'GAME' AND payload->>'type' = 'memory' THEN 'MEMORY'::content_subtype
  ELSE subtype
END,
updated_at = now()
WHERE category = 'ARCADE';

-- PART 4: Remove FLASHCARDS entries (optional - uncomment if you want to remove them)
-- DELETE FROM public.topic_content_entries WHERE category = 'ARCADE' AND subtype = 'FLASHCARDS';

-- PART 5: Fix generated columns to handle new subtypes
-- Drop existing generated columns (no view dependencies now)
ALTER TABLE public.topic_content_entries 
  DROP COLUMN IF EXISTS preview_text,
  DROP COLUMN IF EXISTS detail_text,
  DROP COLUMN IF EXISTS source_text;

-- Recreate generated columns with support for new subtypes
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
            (
              SELECT string_agg(COALESCE(section->>'content', ''), ' ')
              FROM jsonb_array_elements(payload->'sections') AS section
              WHERE COALESCE(section->>'content', '') != ''
            )
          ELSE NULL
        END
      WHEN category = 'ARCADE' AND subtype = 'QUIZ' THEN
        CONCAT('Quiz with ', COALESCE(jsonb_array_length(payload->'questions'), 0)::text, ' questions')
      WHEN category = 'ARCADE' AND subtype = 'CROSSWORD' THEN
        CASE 
          WHEN payload->'clues' IS NOT NULL THEN
            CONCAT('Crossword with ', 
              COALESCE(jsonb_array_length(payload->'clues'->'across'), 0) + 
              COALESCE(jsonb_array_length(payload->'clues'->'down'), 0), 
              ' clues')
          ELSE 'Crossword puzzle'
        END
      WHEN category = 'ARCADE' AND subtype = 'WORDSEARCH' THEN
        CONCAT('Word search with ', COALESCE(jsonb_array_length(payload->'words'), 0)::text, ' words')
      WHEN category = 'ARCADE' AND subtype = 'MEMORY' THEN
        CONCAT('Memory game with ', COALESCE(jsonb_array_length(payload->'pairs'), 0)::text / 2, ' pairs')
      ELSE ''
    END
  ) STORED,
  
  ADD COLUMN source_text TEXT GENERATED ALWAYS AS (
    COALESCE(payload->>'source', payload->>'reference', '')
  ) STORED;

-- PART 6: Recreate the views with updated structure
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
WHERE tce.category = 'DISCOVERY' AND (tce.deleted_at IS NULL OR tce.deleted_at IS NOT NULL);

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
WHERE tce.category = 'ARCADE' AND (tce.deleted_at IS NULL OR tce.deleted_at IS NOT NULL);

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
  AND (tce.deleted_at IS NULL);

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
  AND (tce.deleted_at IS NULL);

-- PART 7: Grant permissions on views
GRANT SELECT ON public.admin_discovery_facts TO authenticated;
GRANT SELECT ON public.admin_arcade_entries TO authenticated;
GRANT SELECT ON public.student_arcade_games TO authenticated;
GRANT SELECT ON public.student_discovery_content TO authenticated;

-- PART 8: Update indexes
DROP INDEX IF EXISTS idx_tce_category_subtype;
CREATE INDEX idx_tce_category_subtype ON public.topic_content_entries(category, subtype, status);

-- PART 9: Show results
SELECT 
  'ARCADE SUBTYPE MIGRATION RESULTS' as status,
  subtype,
  COUNT(*) as count,
  string_agg(title, ', ' ORDER BY title) as sample_titles
FROM public.topic_content_entries 
WHERE category = 'ARCADE' 
GROUP BY subtype 
ORDER BY subtype;