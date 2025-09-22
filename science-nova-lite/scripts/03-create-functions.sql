-- Create all database functions
-- Run this third to set up helper functions

-- Create update timestamp function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create set_updated_at function for lessons
CREATE OR REPLACE FUNCTION set_updated_at() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create handle_updated_at function for AI chat logs
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create is_admin helper function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create profile creation trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, full_name, role, learning_preference, email, grade_level, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'STUDENT'::user_role,
        'VISUAL'::learning_preference,
        NEW.email,
        3, -- Default to grade 3
        NOW(),
        NOW()
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create search function for textbook embeddings
CREATE OR REPLACE FUNCTION search_similar_textbook_content(
    query_embedding vector(1536),
    grade_filter INTEGER,
    match_threshold FLOAT DEFAULT 0.7,
    match_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        te.id,
        te.content,
        te.metadata,
        1 - (te.embedding <=> query_embedding) AS similarity
    FROM textbook_embeddings te
    WHERE 
        te.grade_level = grade_filter
        AND 1 - (te.embedding <=> query_embedding) > match_threshold
    ORDER BY te.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Create progress stats function
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
    SELECT COUNT(DISTINCT topic_id) INTO accessed_count
    FROM user_progress 
    WHERE user_progress.user_id = get_user_progress_stats.user_id;
    
    SELECT COUNT(DISTINCT topic_id) INTO completed_count
    FROM user_progress 
    WHERE user_progress.user_id = get_user_progress_stats.user_id 
    AND completed = true;
    
    BEGIN
        SELECT COUNT(DISTINCT t.study_area_id) INTO areas_count
        FROM user_progress up
        JOIN topics t ON up.topic_id = t.id
        WHERE up.user_id = get_user_progress_stats.user_id;
    EXCEPTION WHEN OTHERS THEN
        areas_count := 0;
    END;
    
    time_spent := accessed_count * 5;
    streak_count := CASE WHEN accessed_count > 0 THEN 1 ELSE 0 END;
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
