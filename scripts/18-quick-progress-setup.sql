-- Quick setup script for essential progress tracking tables
-- Run this if you're getting API errors

-- Ensure user_progress table exists (should already be there from schema setup)
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, topic_id)
);

-- Create adventure_completions table
CREATE TABLE IF NOT EXISTS adventure_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    adventure_id TEXT NOT NULL,
    adventure_title TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, adventure_id)
);

-- Enable RLS on adventure_completions
ALTER TABLE adventure_completions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Users can view their own adventure completions" ON adventure_completions;
DROP POLICY IF EXISTS "Users can insert their own adventure completions" ON adventure_completions;

-- Create policies for adventure_completions
CREATE POLICY "Users can view their own adventure completions" ON adventure_completions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own adventure completions" ON adventure_completions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create simple user progress stats function
CREATE OR REPLACE FUNCTION get_user_progress_stats(user_id UUID)
RETURNS TABLE (
    topics_accessed INTEGER,
    topics_completed INTEGER,
    study_areas_explored INTEGER,
    total_time_spent INTEGER,
    current_streak INTEGER,
    total_sessions INTEGER
) AS $$
DECLARE
    accessed_count INTEGER;
    completed_count INTEGER;
    areas_count INTEGER;
    time_spent INTEGER;
    streak_count INTEGER;
    session_count INTEGER;
BEGIN
    -- Count topics accessed
    SELECT COUNT(DISTINCT topic_id) INTO accessed_count
    FROM user_progress 
    WHERE user_progress.user_id = get_user_progress_stats.user_id;
    
    -- Count topics completed
    SELECT COUNT(DISTINCT topic_id) INTO completed_count
    FROM user_progress 
    WHERE user_progress.user_id = get_user_progress_stats.user_id 
    AND completed = true;
    
    -- Count study areas explored (handle if topics table doesn't have the relation)
    BEGIN
        SELECT COUNT(DISTINCT t.study_area_id) INTO areas_count
        FROM user_progress up
        JOIN topics t ON up.topic_id = t.id
        WHERE up.user_id = get_user_progress_stats.user_id;
    EXCEPTION WHEN OTHERS THEN
        areas_count := 0;
    END;
    
    -- Calculate estimated time spent (5 minutes per topic accessed)
    time_spent := accessed_count * 5;
    
    -- Simple streak calculation
    streak_count := CASE WHEN accessed_count > 0 THEN 1 ELSE 0 END;
    
    -- Count total learning sessions
    session_count := accessed_count;
    
    RETURN QUERY SELECT 
        accessed_count,
        completed_count,
        areas_count,
        time_spent,
        streak_count,
        session_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON user_progress(completed);
CREATE INDEX IF NOT EXISTS idx_adventure_completions_user_id ON adventure_completions(user_id);

-- Confirm setup
SELECT 'Setup complete! Tables and functions created.' as status;
