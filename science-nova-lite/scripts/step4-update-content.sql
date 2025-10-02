-- STEP 4: Drop dependent views and update content (run after all enum values are added)

-- Drop views that depend on columns we need to modify
DROP VIEW IF EXISTS public.admin_discovery_facts CASCADE;
DROP VIEW IF EXISTS public.admin_arcade_entries CASCADE;
DROP VIEW IF EXISTS public.student_arcade_games CASCADE;
DROP VIEW IF EXISTS public.student_discovery_content CASCADE;

-- Update existing content to use specific subtypes
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

-- Optional: Remove FLASHCARDS entries (uncomment if you want to remove them)
-- DELETE FROM public.topic_content_entries WHERE category = 'ARCADE' AND subtype = 'FLASHCARDS';

-- Show what was updated
SELECT 
  'Updated arcade content subtypes' as status,
  subtype,
  COUNT(*) as count
FROM public.topic_content_entries 
WHERE category = 'ARCADE' 
GROUP BY subtype 
ORDER BY subtype;