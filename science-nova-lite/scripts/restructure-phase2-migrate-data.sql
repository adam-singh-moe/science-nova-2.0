-- Database Restructuring: Phase 2 - Data Migration
-- Migrate existing content from topic_content_entries to dedicated tables

-- Step 1: Migrate DISCOVERY content to discovery_content table
INSERT INTO discovery_content (
  topic_id,
  title,
  fact_text,
  detail_explanation,
  source_url,
  content_type,
  ai_generated,
  status,
  created_by,
  created_at,
  updated_at
)
SELECT 
  tce.topic_id,
  tce.title,
  COALESCE(tce.preview_text, tce.title) as fact_text,
  tce.detail_text,
  tce.source_text,
  CASE 
    WHEN tce.subtype = 'FACT' THEN 'fact'
    WHEN tce.subtype = 'INFO' THEN 'info'
    ELSE 'concept'
  END as content_type,
  tce.ai_generated,
  CASE 
    WHEN tce.status = 'published' THEN 'published'
    ELSE 'draft'
  END as status,
  tce.created_by,
  tce.created_at,
  tce.updated_at
FROM topic_content_entries tce
WHERE tce.category = 'DISCOVERY';

-- Step 2: Migrate ARCADE content to arcade_games table
INSERT INTO arcade_games (
  topic_id,
  title,
  description,
  game_type,
  game_data,
  difficulty_level,
  ai_generated,
  status,
  created_by,
  created_at,
  updated_at
)
SELECT 
  tce.topic_id,
  tce.title,
  COALESCE(tce.preview_text, tce.title) as description,
  CASE 
    WHEN tce.subtype = 'QUIZ' THEN 'quiz'
    WHEN tce.subtype = 'CROSSWORD' THEN 'crossword'
    WHEN tce.subtype = 'WORDSEARCH' THEN 'wordsearch' 
    WHEN tce.subtype = 'MEMORY' THEN 'memory'
    WHEN tce.subtype = 'GAME' THEN 
      CASE 
        WHEN tce.payload ? 'pairs' THEN 'memory'
        WHEN tce.payload->'clues' ? 'across' THEN 'crossword'
        WHEN tce.payload ? 'words' AND NOT tce.payload ? 'pairs' THEN 'wordsearch'
        ELSE 'quiz'
      END
    ELSE 'quiz'
  END as game_type,
  COALESCE(tce.payload, '{}') as game_data,
  CASE 
    WHEN tce.difficulty IS NULL THEN 'medium'
    WHEN UPPER(tce.difficulty::text) = 'EASY' OR UPPER(tce.difficulty::text) = 'LOW' THEN 'easy'
    WHEN UPPER(tce.difficulty::text) = 'HARD' OR UPPER(tce.difficulty::text) = 'HIGH' THEN 'hard'
    ELSE 'medium'
  END as difficulty_level,
  tce.ai_generated,
  CASE 
    WHEN tce.status = 'published' THEN 'published'
    ELSE 'draft'
  END as status,
  tce.created_by,
  tce.created_at,
  tce.updated_at
FROM topic_content_entries tce
WHERE tce.category = 'ARCADE' 
  AND tce.subtype != 'FLASHCARDS'; -- Exclude flashcards as requested

-- Step 3: Migrate existing user_progress to user_topic_progress table
-- First, let's see what we have in the current user_progress table
INSERT INTO user_topic_progress (
  user_id,
  topic_id,
  is_completed,
  first_accessed,
  last_accessed,
  completed_at,
  created_at,
  updated_at
)
SELECT 
  up.user_id,
  up.topic_id,
  up.completed,
  up.created_at as first_accessed,
  up.last_accessed,
  CASE WHEN up.completed THEN up.updated_at ELSE NULL END as completed_at,
  up.created_at,
  up.updated_at
FROM user_progress up
ON CONFLICT (user_id, topic_id) DO UPDATE SET
  is_completed = EXCLUDED.is_completed,
  last_accessed = EXCLUDED.last_accessed,
  completed_at = EXCLUDED.completed_at,
  updated_at = EXCLUDED.updated_at;

-- Step 4: Update topic progress totals based on migrated content
UPDATE user_topic_progress 
SET 
  discovery_items_total = (
    SELECT COUNT(*) 
    FROM discovery_content dc 
    WHERE dc.topic_id = user_topic_progress.topic_id 
      AND dc.status = 'published'
  ),
  arcade_games_total = (
    SELECT COUNT(*) 
    FROM arcade_games ag 
    WHERE ag.topic_id = user_topic_progress.topic_id 
      AND ag.status = 'published'
  ),
  lessons_total = (
    SELECT COUNT(*) 
    FROM lessons l 
    WHERE l.topic_id = user_topic_progress.topic_id 
      AND l.status = 'published'
  );

-- Step 5: Create initial achievement definitions
INSERT INTO achievements (name, description, category, achievement_type, criteria, points_reward, badge_icon, difficulty_level) VALUES
-- Discovery Achievements
('Discovery Explorer', 'View your first discovery fact', 'discovery', 'content_completion', '{"type": "discovery_viewed", "threshold": 1}', 10, '🔍', 'bronze'),
('Fact Collector', 'View 10 discovery facts', 'discovery', 'content_completion', '{"type": "discovery_viewed", "threshold": 10}', 50, '📚', 'silver'),
('Science Enthusiast', 'View 25 discovery facts', 'discovery', 'content_completion', '{"type": "discovery_viewed", "threshold": 25}', 100, '🧪', 'gold'),
('Discovery Master', 'View 50 discovery facts', 'discovery', 'content_completion', '{"type": "discovery_viewed", "threshold": 50}', 200, '🏆', 'platinum'),

-- Arcade Achievements  
('Game Rookie', 'Complete your first arcade game', 'arcade', 'content_completion', '{"type": "arcade_completed", "threshold": 1}', 15, '🎮', 'bronze'),
('Quiz Master', 'Score 100% on 5 quiz games', 'arcade', 'score_based', '{"type": "perfect_score", "game_type": "quiz", "threshold": 5}', 75, '🧠', 'silver'),
('Puzzle Solver', 'Complete 10 crossword or wordsearch games', 'arcade', 'content_completion', '{"type": "puzzle_games", "threshold": 10}', 100, '🧩', 'gold'),
('Memory Champion', 'Complete 5 memory games with perfect score', 'arcade', 'score_based', '{"type": "memory_perfect", "threshold": 5}', 150, '🎯', 'platinum'),

-- Streak Achievements
('Daily Learner', 'Learn something new 3 days in a row', 'general', 'streak_based', '{"type": "daily_activity", "threshold": 3}', 30, '📅', 'bronze'),
('Study Streak', 'Learn something new 7 days in a row', 'general', 'streak_based', '{"type": "daily_activity", "threshold": 7}', 100, '🔥', 'silver'),
('Dedicated Student', 'Learn something new 14 days in a row', 'general', 'streak_based', '{"type": "daily_activity", "threshold": 14}', 200, '⭐', 'gold'),

-- Mastery Achievements
('Topic Novice', 'Complete your first topic', 'mastery', 'content_completion', '{"type": "topic_completed", "threshold": 1}', 50, '🌟', 'bronze'),
('Topic Expert', 'Complete 3 topics', 'mastery', 'content_completion', '{"type": "topic_completed", "threshold": 3}', 150, '🎓', 'silver'),
('Science Scholar', 'Complete 5 topics', 'mastery', 'content_completion', '{"type": "topic_completed", "threshold": 5}', 300, '👨‍🎓', 'gold');

-- Step 6: Create views for easy data access
CREATE OR REPLACE VIEW admin_discovery_content AS
SELECT 
  dc.id,
  dc.title,
  dc.fact_text,
  dc.content_type,
  t.title as topic_name,
  t.grade_level,
  dc.verification_status,
  dc.ai_generated,
  dc.status,
  dc.created_at
FROM discovery_content dc
JOIN topics t ON dc.topic_id = t.id
ORDER BY dc.created_at DESC;

CREATE OR REPLACE VIEW admin_arcade_games AS
SELECT 
  ag.id,
  ag.title,
  ag.description,
  ag.game_type,
  ag.difficulty_level,
  t.title as topic_name,
  t.grade_level,
  ag.status,
  ag.ai_generated,
  ag.created_at
FROM arcade_games ag
JOIN topics t ON ag.topic_id = t.id
ORDER BY ag.created_at DESC;

CREATE OR REPLACE VIEW student_dashboard AS
SELECT 
  u.id as user_id,
  u.full_name,
  u.role,
  COUNT(DISTINCT dc.id) as discovery_facts_available,
  COUNT(DISTINCT ag.id) as arcade_games_available,
  COUNT(DISTINCT l.id) as lessons_available,
  COALESCE(SUM(utp.mastery_level), 0) / NULLIF(COUNT(utp.id), 0) as overall_progress
FROM profiles u
CROSS JOIN topics t
LEFT JOIN discovery_content dc ON t.id = dc.topic_id AND dc.status = 'published'
LEFT JOIN arcade_games ag ON t.id = ag.topic_id AND ag.status = 'published'
LEFT JOIN lessons l ON t.id = l.topic_id AND l.status = 'published'
LEFT JOIN user_topic_progress utp ON u.id = utp.user_id AND t.id = utp.topic_id
WHERE u.role NOT IN ('ADMIN', 'DEVELOPER') OR u.role IS NULL -- Include non-admin users as students
GROUP BY u.id, u.full_name, u.role;

-- Migration Summary
SELECT 
  'Phase 2 Migration Complete!' as status,
  'Migrated Content Summary:' as summary,
  (SELECT COUNT(*) FROM discovery_content) as discovery_items,
  (SELECT COUNT(*) FROM arcade_games) as arcade_games,
  (SELECT COUNT(*) FROM achievements) as achievements_created,
  (SELECT COUNT(*) FROM user_topic_progress) as user_progress_records;