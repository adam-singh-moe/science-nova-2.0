-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('STUDENT', 'ADMIN');
CREATE TYPE learning_preference AS ENUM ('STORY', 'VISUAL', 'FACTS');

-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'STUDENT',
    learning_preference learning_preference DEFAULT 'VISUAL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_areas table
CREATE TABLE study_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    vanta_effect TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create topics table
CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    grade_level INTEGER NOT NULL CHECK (grade_level >= 1 AND grade_level <= 6),
    study_area_id UUID NOT NULL REFERENCES study_areas(id) ON DELETE CASCADE,
    admin_prompt TEXT,
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content_cache table for AI-generated content
CREATE TABLE content_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(topic_id, user_id)
);

-- Insert default study areas
INSERT INTO study_areas (name, vanta_effect) VALUES
    ('Biology', 'BIRDS'),
    ('Physics', 'HALO'),
    ('Chemistry', 'NET'),
    ('Geology', 'TOPOLOGY'),
    ('Meteorology', 'CLOUDS2'),
    ('Astronomy', 'RINGS'),
    ('Anatomy', 'CELLS');

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for topics
CREATE POLICY "Everyone can view topics" ON topics
    FOR SELECT USING (true);

CREATE POLICY "Only admins can create topics" ON topics
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Only topic creators can update topics" ON topics
    FOR UPDATE USING (creator_id = auth.uid());

-- RLS Policies for content_cache
CREATE POLICY "Users can view own cached content" ON content_cache
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own cached content" ON content_cache
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own cached content" ON content_cache
    FOR UPDATE USING (user_id = auth.uid());
