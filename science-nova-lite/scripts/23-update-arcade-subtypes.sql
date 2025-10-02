-- 23-update-arcade-subtypes.sql
-- Update content_subtype enum to have specific subtypes for each arcade game type
-- Remove FLASHCARDS subtype and replace generic GAME with specific game types

-- Step 1: Add the new subtype values to the enum
ALTER TYPE content_subtype ADD VALUE IF NOT EXISTS 'CROSSWORD';
ALTER TYPE content_subtype ADD VALUE IF NOT EXISTS 'WORDSEARCH';  
ALTER TYPE content_subtype ADD VALUE IF NOT EXISTS 'MEMORY';

-- Step 2: Update existing ARCADE entries with subtype 'GAME' to use specific subtypes
-- This checks the payload structure to determine the correct subtype
UPDATE public.topic_content_entries 
SET subtype = CASE
  -- Memory games have 'pairs' in payload
  WHEN category = 'ARCADE' AND subtype = 'GAME' AND payload ? 'pairs' THEN 'MEMORY'::content_subtype
  -- Crosswords have 'clues' with 'across' and 'down' in payload  
  WHEN category = 'ARCADE' AND subtype = 'GAME' AND payload->'clues' ? 'across' THEN 'CROSSWORD'::content_subtype
  -- Word searches have 'words' array in payload (but not pairs like memory games)
  WHEN category = 'ARCADE' AND subtype = 'GAME' AND payload ? 'words' AND NOT payload ? 'pairs' THEN 'WORDSEARCH'::content_subtype
  -- True/false games and other generic games remain as GAME for now, but let's check payload.type
  WHEN category = 'ARCADE' AND subtype = 'GAME' AND payload->>'type' = 'crossword' THEN 'CROSSWORD'::content_subtype
  WHEN category = 'ARCADE' AND subtype = 'GAME' AND payload->>'type' = 'wordsearch' THEN 'WORDSEARCH'::content_subtype
  WHEN category = 'ARCADE' AND subtype = 'GAME' AND payload->>'type' = 'memory' THEN 'MEMORY'::content_subtype
  -- Default case - keep existing subtype
  ELSE subtype
END,
updated_at = now()
WHERE category = 'ARCADE' AND subtype = 'GAME';

-- Step 3: Remove any FLASHCARDS entries (if they exist) as they're no longer used
DELETE FROM public.topic_content_entries 
WHERE category = 'ARCADE' AND subtype = 'FLASHCARDS';

-- Step 4: Create a new enum without GAME and FLASHCARDS
-- We need to create a new enum and migrate to it since PostgreSQL doesn't support removing enum values
CREATE TYPE content_subtype_new AS ENUM ('QUIZ','CROSSWORD','WORDSEARCH','MEMORY','FACT','INFO');

-- Step 5: Update the table to use the new enum
ALTER TABLE public.topic_content_entries 
ALTER COLUMN subtype TYPE content_subtype_new 
USING subtype::text::content_subtype_new;

-- Step 6: Drop the old enum and rename the new one
DROP TYPE content_subtype;
ALTER TYPE content_subtype_new RENAME TO content_subtype;

-- Step 7: Update any existing views or indexes that might be affected
-- Recreate the category/subtype index to ensure it's optimized for the new enum values
DROP INDEX IF EXISTS idx_tce_category_subtype;
CREATE INDEX idx_tce_category_subtype ON public.topic_content_entries(category, subtype, status);

-- Step 8: Update generated columns in the schema enhancement to handle the new subtypes
-- This updates the generated columns to properly handle the specific arcade game subtypes
ALTER TABLE public.topic_content_entries 
DROP COLUMN IF EXISTS detail_text;

ALTER TABLE public.topic_content_entries
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
) STORED;

-- Step 9: Verify the changes
DO $$
DECLARE
  arcade_count INTEGER;
  quiz_count INTEGER;
  crossword_count INTEGER;
  wordsearch_count INTEGER;
  memory_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO arcade_count FROM topic_content_entries WHERE category = 'ARCADE';
  SELECT COUNT(*) INTO quiz_count FROM topic_content_entries WHERE category = 'ARCADE' AND subtype = 'QUIZ';
  SELECT COUNT(*) INTO crossword_count FROM topic_content_entries WHERE category = 'ARCADE' AND subtype = 'CROSSWORD';
  SELECT COUNT(*) INTO wordsearch_count FROM topic_content_entries WHERE category = 'ARCADE' AND subtype = 'WORDSEARCH';
  SELECT COUNT(*) INTO memory_count FROM topic_content_entries WHERE category = 'ARCADE' AND subtype = 'MEMORY';
  
  RAISE NOTICE 'Migration complete! Arcade content summary:';
  RAISE NOTICE '  Total arcade entries: %', arcade_count;
  RAISE NOTICE '  Quiz entries: %', quiz_count;
  RAISE NOTICE '  Crossword entries: %', crossword_count;
  RAISE NOTICE '  Word search entries: %', wordsearch_count;
  RAISE NOTICE '  Memory game entries: %', memory_count;
END $$;