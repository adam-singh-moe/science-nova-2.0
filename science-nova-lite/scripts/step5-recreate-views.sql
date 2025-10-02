-- STEP 5: Recreate views with specific subtypes (run after content is updated)

-- Recreate the admin arcade entries view with proper subtype handling
CREATE OR REPLACE VIEW public.admin_arcade_entries AS
SELECT 
  tce.id,
  tce.title,
  tce.preview_text,
  t.grade_level,
  t.title as topic_name,
  tce.subtype,
  COALESCE(tce.payload->>'description', tce.preview_text) as description,
  CASE 
    WHEN tce.subtype = 'CROSSWORD' THEN 'crossword'
    WHEN tce.subtype = 'WORDSEARCH' THEN 'word-search'
    WHEN tce.subtype = 'MEMORY' THEN 'memory-game'
    WHEN tce.subtype = 'QUIZ' THEN 'quiz'
    ELSE 'game'
  END as game_type,
  tce.created_at,
  tce.updated_at
FROM public.topic_content_entries tce
JOIN public.topics t ON tce.topic_id = t.id
WHERE tce.category = 'ARCADE'
ORDER BY tce.created_at DESC;

-- Recreate the student arcade games view
CREATE OR REPLACE VIEW public.student_arcade_games AS
SELECT 
  tce.id,
  tce.title,
  tce.preview_text,
  t.grade_level,
  t.title as topic_name,
  tce.subtype,
  tce.payload,
  CASE 
    WHEN tce.subtype = 'CROSSWORD' THEN 'crossword'
    WHEN tce.subtype = 'WORDSEARCH' THEN 'word-search'
    WHEN tce.subtype = 'MEMORY' THEN 'memory-game'
    WHEN tce.subtype = 'QUIZ' THEN 'quiz'
    ELSE 'game'
  END as game_type,
  tce.created_at
FROM public.topic_content_entries tce
JOIN public.topics t ON tce.topic_id = t.id
WHERE tce.category = 'ARCADE'
  AND tce.subtype IN ('QUIZ', 'CROSSWORD', 'WORDSEARCH', 'MEMORY')
ORDER BY tce.created_at DESC;

-- Show final status
SELECT 
  'Migration complete!' as status,
  'Arcade games now use specific subtypes' as message;
  
-- Show the updated arcade games
SELECT 
  title,
  subtype,
  game_type
FROM public.admin_arcade_entries
ORDER BY created_at DESC
LIMIT 10;