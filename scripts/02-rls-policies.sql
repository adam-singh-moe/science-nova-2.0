-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE textbook_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for profiles

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (is_admin());

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile during signup
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for study_areas

-- Everyone can view study areas
CREATE POLICY "Everyone can view study areas" ON study_areas
    FOR SELECT USING (true);

-- Only admins can insert/update/delete study areas
CREATE POLICY "Only admins can insert study areas" ON study_areas
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only admins can update study areas" ON study_areas
    FOR UPDATE USING (is_admin());

CREATE POLICY "Only admins can delete study areas" ON study_areas
    FOR DELETE USING (is_admin());

-- RLS Policies for topics

-- Everyone can view topics
CREATE POLICY "Everyone can view topics" ON topics
    FOR SELECT USING (true);

-- Only admins can create topics
CREATE POLICY "Only admins can create topics" ON topics
    FOR INSERT WITH CHECK (is_admin());

-- Only topic creators or admins can update topics
CREATE POLICY "Only topic creators or admins can update topics" ON topics
    FOR UPDATE USING (creator_id = auth.uid() OR is_admin());

-- Only topic creators or admins can delete topics
CREATE POLICY "Only topic creators or admins can delete topics" ON topics
    FOR DELETE USING (creator_id = auth.uid() OR is_admin());

-- RLS Policies for content_cache

-- Users can view their own cached content
CREATE POLICY "Users can view own cached content" ON content_cache
    FOR SELECT USING (user_id = auth.uid());

-- Admins can view all cached content
CREATE POLICY "Admins can view all cached content" ON content_cache
    FOR SELECT USING (is_admin());

-- Users can insert their own cached content
CREATE POLICY "Users can insert own cached content" ON content_cache
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own cached content
CREATE POLICY "Users can update own cached content" ON content_cache
    FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own cached content
CREATE POLICY "Users can delete own cached content" ON content_cache
    FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for textbook_content

-- Everyone can view textbook content
CREATE POLICY "Everyone can view textbook content" ON textbook_content
    FOR SELECT USING (true);

-- Only admins can manage textbook content
CREATE POLICY "Only admins can insert textbook content" ON textbook_content
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only admins can update textbook content" ON textbook_content
    FOR UPDATE USING (is_admin());

CREATE POLICY "Only admins can delete textbook content" ON textbook_content
    FOR DELETE USING (is_admin());

-- RLS Policies for user_progress

-- Users can view their own progress
CREATE POLICY "Users can view own progress" ON user_progress
    FOR SELECT USING (user_id = auth.uid());

-- Admins can view all user progress
CREATE POLICY "Admins can view all progress" ON user_progress
    FOR SELECT USING (is_admin());

-- Users can insert/update their own progress
CREATE POLICY "Users can insert own progress" ON user_progress
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own progress" ON user_progress
    FOR UPDATE USING (user_id = auth.uid());
