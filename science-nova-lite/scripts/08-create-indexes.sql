-- Create performance indexes
-- Run this eighth to optimize database performance

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_user_id ON ai_chat_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_created_at ON ai_chat_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_lessons_owner ON lessons(owner_id);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);
CREATE INDEX IF NOT EXISTS idx_lessons_updated_at ON lessons(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_lessons_grade ON lessons(grade_level);
CREATE INDEX IF NOT EXISTS idx_lessons_title_trgm ON lessons USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_lessons_topic_trgm ON lessons USING gin (topic gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_lae_user_created ON lesson_activity_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lae_user_lesson ON lesson_activity_events(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_lae_event_type ON lesson_activity_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON user_progress(completed);
CREATE INDEX IF NOT EXISTS idx_adventure_completions_user_id ON adventure_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_adventure_completions_completed_at ON adventure_completions(completed_at);
CREATE INDEX IF NOT EXISTS textbook_embeddings_embedding_idx ON textbook_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS textbook_embeddings_grade_idx ON textbook_embeddings (grade_level);
