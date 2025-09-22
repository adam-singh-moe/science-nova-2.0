-- Create Row Level Security policies
-- Run this sixth to set up security policies

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (is_admin());

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Study areas policies
CREATE POLICY "Everyone can view study areas" ON study_areas
    FOR SELECT USING (true);

CREATE POLICY "Only admins can insert study areas" ON study_areas
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only admins can update study areas" ON study_areas
    FOR UPDATE USING (is_admin());

CREATE POLICY "Only admins can delete study areas" ON study_areas
    FOR DELETE USING (is_admin());

-- Topics policies
CREATE POLICY "Everyone can view topics" ON topics
    FOR SELECT USING (true);

CREATE POLICY "Only admins can create topics" ON topics
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only topic creators or admins can update topics" ON topics
    FOR UPDATE USING (creator_id = auth.uid() OR is_admin());

CREATE POLICY "Only topic creators or admins can delete topics" ON topics
    FOR DELETE USING (creator_id = auth.uid() OR is_admin());

-- Content cache policies
CREATE POLICY "Users can view own cached content" ON content_cache
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all cached content" ON content_cache
    FOR SELECT USING (is_admin());

CREATE POLICY "Users can insert own cached content" ON content_cache
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own cached content" ON content_cache
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own cached content" ON content_cache
    FOR DELETE USING (user_id = auth.uid());

-- Textbook content policies
CREATE POLICY "Everyone can view textbook content" ON textbook_content
    FOR SELECT USING (true);

CREATE POLICY "Only admins can insert textbook content" ON textbook_content
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only admins can update textbook content" ON textbook_content
    FOR UPDATE USING (is_admin());

CREATE POLICY "Only admins can delete textbook content" ON textbook_content
    FOR DELETE USING (is_admin());

-- User progress policies
CREATE POLICY "Users can view own progress" ON user_progress
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all progress" ON user_progress
    FOR SELECT USING (is_admin());

CREATE POLICY "Users can insert own progress" ON user_progress
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own progress" ON user_progress
    FOR UPDATE USING (user_id = auth.uid());

-- Lessons policies
CREATE POLICY "select_own_or_published" ON lessons
    FOR SELECT USING (
        auth.uid() = owner_id
        OR status = 'published'
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role::text IN ('ADMIN','DEVELOPER')
        )
    );

CREATE POLICY "insert_own" ON lessons
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "update_own_or_admin" ON lessons
    FOR UPDATE USING (
        auth.uid() = owner_id OR EXISTS (
            SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role::text IN ('ADMIN','DEVELOPER')
        )
    ) WITH CHECK (
        auth.uid() = owner_id OR EXISTS (
            SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role::text IN ('ADMIN','DEVELOPER')
        )
    );

CREATE POLICY "delete_own_or_admin" ON lessons
    FOR DELETE USING (
        auth.uid() = owner_id OR EXISTS (
            SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role::text IN ('ADMIN','DEVELOPER')
        )
    );

-- Lesson activity events policies
CREATE POLICY "lae_insert_own" ON lesson_activity_events
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "lae_select_own" ON lesson_activity_events
    FOR SELECT USING (user_id = auth.uid());

-- Adventure policies
CREATE POLICY "Users can view their own adventures" ON daily_adventures
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own adventures" ON daily_adventures
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own adventures" ON daily_adventures
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own adventure completions" ON adventure_completions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own adventure completions" ON adventure_completions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI chat logs policies
CREATE POLICY "Users can view their own chat logs" ON ai_chat_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat logs" ON ai_chat_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
