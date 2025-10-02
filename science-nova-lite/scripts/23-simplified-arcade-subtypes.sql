-- Simplified Arcade Subtype Migration 
-- Run this in Supabase SQL Editor to update arcade game subtypes

-- Step 1: Add new enum values (safe operation)
ALTER TYPE content_subtype ADD VALUE IF NOT EXISTS 'CROSSWORD';
ALTER TYPE content_subtype ADD VALUE IF NOT EXISTS 'WORDSEARCH';  
ALTER TYPE content_subtype ADD VALUE IF NOT EXISTS 'MEMORY';

-- Step 2: Update existing content to use specific subtypes
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

-- Step 3: Remove FLASHCARDS entries (optional - remove if you want to keep them)
-- DELETE FROM public.topic_content_entries WHERE category = 'ARCADE' AND subtype = 'FLASHCARDS';

-- Step 4: Show results
SELECT 
  subtype,
  COUNT(*) as count,
  array_agg(title ORDER BY title) as titles
FROM public.topic_content_entries 
WHERE category = 'ARCADE' 
GROUP BY subtype 
ORDER BY subtype;