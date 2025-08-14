-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for user roles and learning preferences
CREATE TYPE user_role AS ENUM ('STUDENT', 'ADMIN');
CREATE TYPE learning_preference AS ENUM ('STORY', 'VISUAL', 'FACTS');

-- Create profiles table linked to Supabase auth.users
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'STUDENT',
    learning_preference learning_preference DEFAULT 'VISUAL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_areas table
CREATE TABLE IF NOT EXISTS study_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    vanta_effect TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create topics table
CREATE TABLE IF NOT EXISTS topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    grade_level INTEGER NOT NULL CHECK (grade_level >= 1 AND grade_level <= 6),
    study_area_id UUID NOT NULL REFERENCES study_areas(id) ON DELETE CASCADE,
    admin_prompt TEXT,
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content_cache table for AI-generated content
CREATE TABLE IF NOT EXISTS content_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(topic_id, user_id)
);

-- Create textbook_content table to store reference materials
CREATE TABLE IF NOT EXISTS textbook_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    study_area_id UUID NOT NULL REFERENCES study_areas(id) ON DELETE CASCADE,
    grade_level INTEGER NOT NULL CHECK (grade_level >= 1 AND grade_level <= 6),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    storage_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(study_area_id, grade_level, title)
);

-- Create user_progress table to track student progress
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

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_profiles_modtime
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_study_areas_modtime
BEFORE UPDATE ON study_areas
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_topics_modtime
BEFORE UPDATE ON topics
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_content_cache_modtime
BEFORE UPDATE ON content_cache
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_textbook_content_modtime
BEFORE UPDATE ON textbook_content
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_user_progress_modtime
BEFORE UPDATE ON user_progress
FOR EACH ROW EXECUTE FUNCTION update_modified_column();
