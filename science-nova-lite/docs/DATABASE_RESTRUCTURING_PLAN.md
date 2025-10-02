# 🏗️ Database Restructuring Plan - Science Learning Platform

## Current Problems
- ❌ All content types mixed in single `topic_content_entries` table
- ❌ Generic category/subtype system not optimal for specialized content
- ❌ No dedicated lessons content management
- ❌ No proper achievements or user activity tracking
- ❌ No metrics-based progress tracking
- ❌ Unnecessary study_areas table for single-subject platform

## New Database Architecture

### Core Content Tables

#### 1. `topics` (Enhanced)
```sql
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 1 AND 12),
  learning_objectives TEXT[],
  prerequisites UUID[] REFERENCES topics(id),
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_time_minutes INTEGER,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  creator_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. `discovery_content` (Dedicated Discovery Facts)
```sql
CREATE TABLE discovery_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  fact_text TEXT NOT NULL,
  detail_explanation TEXT,
  fun_fact_points TEXT[],
  source_url VARCHAR(500),
  source_citation TEXT,
  image_url VARCHAR(500),
  content_type VARCHAR(20) CHECK (content_type IN ('fact', 'info', 'concept')),
  reading_level INTEGER CHECK (reading_level BETWEEN 1 AND 12),
  tags TEXT[],
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'needs_review')),
  ai_generated BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. `arcade_games` (Dedicated Game Content)
```sql
CREATE TABLE arcade_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  game_type VARCHAR(20) NOT NULL CHECK (game_type IN ('quiz', 'crossword', 'wordsearch', 'memory')),
  game_data JSONB NOT NULL, -- Specific to game type
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  estimated_play_time INTEGER, -- minutes
  scoring_system JSONB, -- { "max_score": 100, "time_bonus": true, "hints_penalty": 5 }
  hints JSONB, -- Available hints for the game
  educational_objectives TEXT[],
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  ai_generated BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. `lessons` (Structured Learning Content)
```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  lesson_order INTEGER NOT NULL,
  content_blocks JSONB NOT NULL, -- [{"type": "text", "content": "..."}, {"type": "image", "url": "..."}, {"type": "video", "url": "..."}]
  learning_objectives TEXT[],
  key_concepts TEXT[],
  vocabulary_terms JSONB, -- {"term": "definition"}
  activities JSONB, -- Interactive activities within lesson
  assessment_questions JSONB, -- Quick comprehension checks
  estimated_duration INTEGER, -- minutes
  prerequisite_lessons UUID[] REFERENCES lessons(id),
  resources JSONB, -- Additional resources, links, downloads
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### User Progress & Activity Tracking

#### 5. `user_activity` (Comprehensive Activity Tracking)
```sql
CREATE TABLE user_activity (
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
  duration_seconds INTEGER,
  score INTEGER,
  max_possible_score INTEGER,
  attempts INTEGER DEFAULT 1,
  hints_used INTEGER DEFAULT 0,
  completion_percentage DECIMAL(5,2),
  
  -- Context Data
  activity_data JSONB, -- Specific data per activity type
  session_id UUID, -- Group activities in same session
  device_type VARCHAR(20),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6. `achievements` (Achievement System)
```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(30) CHECK (category IN ('discovery', 'arcade', 'lessons', 'general', 'mastery')),
  achievement_type VARCHAR(30) CHECK (achievement_type IN (
    'content_completion', 'score_based', 'streak_based', 'time_based', 'mastery_based'
  )),
  
  -- Achievement Criteria (JSON structure defines requirements)
  criteria JSONB NOT NULL, -- {"type": "discovery_count", "threshold": 50, "timeframe": "week"}
  
  -- Rewards
  points_reward INTEGER DEFAULT 0,
  badge_icon VARCHAR(100),
  badge_color VARCHAR(20),
  
  -- Metadata
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('bronze', 'silver', 'gold', 'platinum')),
  is_repeatable BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 7. `user_achievements` (User Achievement Progress)
```sql
CREATE TABLE user_achievements (
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
```

#### 8. `user_topic_progress` (Enhanced Topic Progress)
```sql
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
  average_arcade_score DECIMAL(5,2),
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
```

## Migration Strategy

### Phase 1: Create New Tables
1. Create all new dedicated tables
2. Set up indexes and constraints
3. Create triggers for auto-updates

### Phase 2: Data Migration
1. Migrate DISCOVERY content → `discovery_content`
2. Migrate ARCADE content → `arcade_games`
3. Migrate existing progress → `user_topic_progress`
4. Create initial achievements

### Phase 3: Application Updates
1. Update API endpoints for new table structure
2. Modify admin interfaces for content management
3. Update student interfaces for new content access
4. Implement activity tracking

### Phase 4: Cleanup
1. Drop old `topic_content_entries` table
2. Remove `study_areas` table
3. Update database views
4. Test all functionality

## Key Benefits

### 🎯 **Content Management**
- Dedicated tables for each content type
- Type-specific fields and validation
- Better performance and maintainability

### 📊 **Analytics & Reporting**
- Comprehensive activity tracking
- Metrics-based achievement system
- Detailed progress monitoring
- Weekly report generation capability

### 🏆 **Achievement System**
- Flexible criteria-based achievements
- Progress tracking per user
- Repeatable and streak-based achievements
- Points and badge rewards

### 🚀 **Scalability**
- Optimized for science learning platform
- Focused on single subject area
- Efficient querying and indexing
- Future-proof structure for platform growth

## Next Steps
1. Review and approve this structure
2. Create detailed migration scripts
3. Update API endpoints
4. Implement new admin interfaces
5. Test with existing data