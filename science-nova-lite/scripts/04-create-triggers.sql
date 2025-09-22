-- Create all database triggers
-- Run this fourth to set up automatic triggers

-- Create all triggers for updated_at timestamps
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

CREATE TRIGGER update_textbook_embeddings_modtime
    BEFORE UPDATE ON textbook_embeddings
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trg_lessons_updated_at
    BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER handle_ai_chat_logs_updated_at
    BEFORE UPDATE ON ai_chat_logs
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Create trigger for automatic profile creation when new user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
