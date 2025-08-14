-- Create useful views and functions for the application

-- View for topics with study area details
CREATE OR REPLACE VIEW topic_details AS
SELECT 
    t.id,
    t.title,
    t.grade_level,
    t.admin_prompt,
    t.creator_id,
    t.created_at,
    t.updated_at,
    s.id AS study_area_id,
    s.name AS study_area_name,
    s.vanta_effect,
    s.description AS study_area_description,
    p.full_name AS creator_name
FROM 
    topics t
JOIN 
    study_areas s ON t.study_area_id = s.id
JOIN 
    profiles p ON t.creator_id = p.id;

-- View for user progress statistics
CREATE OR REPLACE VIEW user_progress_stats AS
SELECT 
    p.id AS user_id,
    p.full_name,
    p.role,
    p.learning_preference,
    COUNT(DISTINCT up.topic_id) AS topics_accessed,
    SUM(CASE WHEN up.completed THEN 1 ELSE 0 END) AS topics_completed,
    COUNT(DISTINCT t.study_area_id) AS study_areas_explored
FROM 
    profiles p
LEFT JOIN 
    user_progress up ON p.id = up.user_id
LEFT JOIN 
    topics t ON up.topic_id = t.id
GROUP BY 
    p.id, p.full_name, p.role, p.learning_preference;

-- Function to get recommended topics for a user based on their progress and preferences
CREATE OR REPLACE FUNCTION get_recommended_topics(user_id UUID, limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
    topic_id UUID,
    title TEXT,
    grade_level INTEGER,
    study_area_name TEXT,
    vanta_effect TEXT,
    recommendation_reason TEXT
) AS $$
DECLARE
    user_grade INTEGER;
    user_preference learning_preference;
BEGIN
    -- Get user's learning preference
    SELECT learning_preference INTO user_preference
    FROM profiles
    WHERE id = user_id;
    
    -- Get user's approximate grade level based on completed topics
    SELECT COALESCE(MAX(t.grade_level), 1) INTO user_grade
    FROM user_progress up
    JOIN topics t ON up.topic_id = t.id
    WHERE up.user_id = user_id AND up.completed = true;
    
    -- Return recommended topics
    RETURN QUERY
    WITH completed_topics AS (
        SELECT topic_id
        FROM user_progress
        WHERE user_id = user_id AND completed = true
    ),
    accessed_topics AS (
        SELECT topic_id
        FROM user_progress
        WHERE user_id = user_id
    ),
    study_area_interests AS (
        SELECT t.study_area_id, COUNT(*) as interest_count
        FROM user_progress up
        JOIN topics t ON up.topic_id = t.id
        WHERE up.user_id = user_id
        GROUP BY t.study_area_id
    )
    SELECT 
        t.id AS topic_id,
        t.title,
        t.grade_level,
        s.name AS study_area_name,
        s.vanta_effect,
        CASE
            WHEN t.grade_level = user_grade AND t.id NOT IN (SELECT topic_id FROM accessed_topics) 
                THEN 'This topic matches your current grade level'
            WHEN t.grade_level = user_grade + 1 AND EXISTS (
                SELECT 1 FROM completed_topics ct
                JOIN topics prev_t ON ct.topic_id = prev_t.id
                WHERE prev_t.study_area_id = t.study_area_id AND prev_t.grade_level = user_grade
            ) THEN 'This is a more advanced topic in a subject you''ve completed'
            WHEN t.study_area_id IN (
                SELECT study_area_id FROM study_area_interests
                ORDER BY interest_count DESC
                LIMIT 2
            ) AND t.id NOT IN (SELECT topic_id FROM accessed_topics)
                THEN 'This topic is in a subject area you''ve shown interest in'
            ELSE 'This topic might be interesting for you'
        END AS recommendation_reason
    FROM topics t
    JOIN study_areas s ON t.study_area_id = s.id
    WHERE t.id NOT IN (SELECT topic_id FROM completed_topics)
    AND t.grade_level BETWEEN GREATEST(1, user_grade - 1) AND user_grade + 1
    ORDER BY 
        CASE WHEN t.grade_level = user_grade THEN 0
             WHEN t.grade_level = user_grade + 1 THEN 1
             ELSE 2
        END,
        (t.study_area_id IN (
            SELECT study_area_id FROM study_area_interests
            ORDER BY interest_count DESC
            LIMIT 2
        )) DESC,
        t.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark a topic as completed for a user
CREATE OR REPLACE FUNCTION mark_topic_completed(user_id UUID, topic_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    success BOOLEAN;
BEGIN
    INSERT INTO user_progress (user_id, topic_id, completed, last_accessed)
    VALUES (user_id, topic_id, true, NOW())
    ON CONFLICT (user_id, topic_id) DO UPDATE
    SET completed = true,
        last_accessed = NOW();
        
    GET DIAGNOSTICS success = ROW_COUNT;
    RETURN success > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track topic access
CREATE OR REPLACE FUNCTION track_topic_access(user_id UUID, topic_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    success BOOLEAN;
BEGIN
    INSERT INTO user_progress (user_id, topic_id, last_accessed)
    VALUES (user_id, topic_id, NOW())
    ON CONFLICT (user_id, topic_id) DO UPDATE
    SET last_accessed = NOW();
        
    GET DIAGNOSTICS success = ROW_COUNT;
    RETURN success > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
