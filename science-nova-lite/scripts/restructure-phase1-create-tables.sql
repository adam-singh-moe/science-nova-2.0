-- Database Restructuring: Phase 1 - Create New Tables
-- Science Learning Platform - Dedicated Content Tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Enhanced Topics Table (modify existing)
ALTER TABLE topics 
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS learning_objectives TEXT[],
  ADD COLUMN IF NOT EXISTS prerequisites UUID[],
  ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  ADD COLUMN IF NOT EXISTS estimated_time_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived'));

-- 2. Discovery Content Table
CREATE TABLE IF NOT EXISTS discovery_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  fact_text TEXT NOT NULL,
  detail_explanation TEXT,
  fun_fact_points TEXT[],
  source_url VARCHAR(500),
  source_citation TEXT,
  image_url VARCHAR(500),
  content_type VARCHAR(20) DEFAULT 'fact' CHECK (content_type IN ('fact', 'info', 'concept')),
  reading_level INTEGER CHECK (reading_level BETWEEN 1 AND 12),
  tags TEXT[],
  verification_status VARCHAR(20) DEFAULT 'verified' CHECK (verification_status IN ('pending', 'verified', 'needs_review')),
  ai_generated BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Arcade Games Table
CREATE TABLE IF NOT EXISTS arcade_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  game_type VARCHAR(20) NOT NULL CHECK (game_type IN ('quiz', 'crossword', 'wordsearch', 'memory')),
  game_data JSONB NOT NULL, -- Specific to game type
  difficulty_level VARCHAR(20) DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  estimated_play_time INTEGER DEFAULT 5, -- minutes
  scoring_system JSONB DEFAULT '{"max_score": 100, "time_bonus": true, "hints_penalty": 5}',
  hints JSONB DEFAULT '[]', -- Available hints for the game
  educational_objectives TEXT[],
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  ai_generated BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enhanced Lessons Table (modify existing if needed)
-- Create lessons table if it doesn't exist
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new columns to existing lessons table (including topic_id first without constraint)
ALTER TABLE lessons 
  ADD COLUMN IF NOT EXISTS topic_id UUID,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS lesson_order INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS content_blocks JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS learning_objectives TEXT[],
  ADD COLUMN IF NOT EXISTS key_concepts TEXT[],
  ADD COLUMN IF NOT EXISTS vocabulary_terms JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS activities JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS assessment_questions JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS estimated_duration INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS prerequisite_lessons UUID[],
  ADD COLUMN IF NOT EXISTS resources JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- Add foreign key constraint for topic_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'lessons_topic_id_fkey'
  ) THEN
    ALTER TABLE lessons ADD CONSTRAINT lessons_topic_id_fkey 
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key constraint for created_by if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'lessons_created_by_fkey'
  ) THEN
    ALTER TABLE lessons ADD CONSTRAINT lessons_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES profiles(id);
  END IF;
END $$;

-- Add constraints if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'lessons_status_check'
  ) THEN
    ALTER TABLE lessons ADD CONSTRAINT lessons_status_check 
    CHECK (status IN ('draft', 'published', 'archived'));
  END IF;
END $$;

-- 5. User Activity Tracking Table
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type VARCHAR(30) NOT NULL CHECK (activity_type IN (
    'discovery_viewed', 'discovery_completed', 'discovery_bookmarked',
    'arcade_played', 'arcade_completed', 'arcade_high_score',
    'lesson_started', 'lesson_completed', 'lesson_quiz_passed',
    'topic_mastered', 'achievement_earned'
  )),
  content_type VARCHAR(20) CHECK (content_type IN ('discovery', 'arcade', 'lesson', 'topic')),
  content_id UUID, -- References discovery_content.id, arcade_games.id, or lessons.id
  topic_id UUID REFERENCES topics(id),
  
  -- Activity Metrics
  duration_seconds INTEGER DEFAULT 0,
  score INTEGER,
  max_possible_score INTEGER,
  attempts INTEGER DEFAULT 1,
  hints_used INTEGER DEFAULT 0,
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Context Data
  activity_data JSONB DEFAULT '{}', -- Specific data per activity type
  session_id UUID DEFAULT gen_random_uuid(), -- Group activities in same session
  device_type VARCHAR(20) DEFAULT 'web',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Achievements Table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(30) NOT NULL CHECK (category IN ('discovery', 'arcade', 'lessons', 'general', 'mastery')),
  achievement_type VARCHAR(30) NOT NULL CHECK (achievement_type IN (
    'content_completion', 'score_based', 'streak_based', 'time_based', 'mastery_based'
  )),
  
  -- Achievement Criteria (JSON structure defines requirements)
  criteria JSONB NOT NULL, -- {"type": "discovery_count", "threshold": 50, "timeframe": "week"}
  
  -- Rewards
  points_reward INTEGER DEFAULT 0,
  badge_icon VARCHAR(100),
  badge_color VARCHAR(20) DEFAULT 'blue',
  
  -- Metadata
  difficulty_level VARCHAR(20) DEFAULT 'bronze' CHECK (difficulty_level IN ('bronze', 'silver', 'gold', 'platinum')),
  is_repeatable BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. User Achievements Progress Table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  
  -- Progress Tracking
  current_progress INTEGER DEFAULT 0,
  target_progress INTEGER,
  is_completed BOOLEAN DEFAULT FALSE,
  completion_date TIMESTAMPTZ,
  
  -- Streak/Time-based tracking
  streak_count INTEGER DEFAULT 0,
  last_activity_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_id)
);

-- 8. Enhanced User Topic Progress Table (replace existing)
DROP TABLE IF EXISTS user_topic_progress;
CREATE TABLE user_topic_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  
  -- Progress Metrics
  discovery_items_viewed INTEGER DEFAULT 0,
  discovery_items_total INTEGER DEFAULT 0,
  arcade_games_played INTEGER DEFAULT 0,
  arcade_games_total INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  lessons_total INTEGER DEFAULT 0,
  
  -- Performance Metrics
  average_arcade_score DECIMAL(5,2) DEFAULT 0,
  total_time_spent INTEGER DEFAULT 0, -- seconds
  mastery_level DECIMAL(5,2) DEFAULT 0, -- 0-100%
  
  -- Status
  is_completed BOOLEAN DEFAULT FALSE,
  first_accessed TIMESTAMPTZ,
  last_accessed TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, topic_id)
);

-- Create Indexes for Performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_discovery_content_topic_id ON discovery_content(topic_id);
CREATE INDEX IF NOT EXISTS idx_discovery_content_status ON discovery_content(status);
CREATE INDEX IF NOT EXISTS idx_arcade_games_topic_id ON arcade_games(topic_id);
CREATE INDEX IF NOT EXISTS idx_arcade_games_game_type ON arcade_games(game_type);
CREATE INDEX IF NOT EXISTS idx_lessons_topic_id ON lessons(topic_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons(topic_id, lesson_order);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_topic_progress_user_id ON user_topic_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_topic_progress_topic_id ON user_topic_progress(topic_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers only if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_topics_updated_at') THEN
    CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_discovery_content_updated_at') THEN
    CREATE TRIGGER update_discovery_content_updated_at BEFORE UPDATE ON discovery_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_arcade_games_updated_at') THEN
    CREATE TRIGGER update_arcade_games_updated_at BEFORE UPDATE ON arcade_games FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_lessons_updated_at') THEN
    CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_achievements_updated_at') THEN
    CREATE TRIGGER update_achievements_updated_at BEFORE UPDATE ON achievements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_achievements_updated_at') THEN
    CREATE TRIGGER update_user_achievements_updated_at BEFORE UPDATE ON user_achievements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_topic_progress_updated_at') THEN
    CREATE TRIGGER update_user_topic_progress_updated_at BEFORE UPDATE ON user_topic_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Success message
SELECT 'Database restructuring Phase 1 complete! New dedicated tables created.' as status;