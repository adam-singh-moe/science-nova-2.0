-- STEP 2: Essential non-vector indexes (SAFE VERSION)
-- These indexes are guaranteed to work on Supabase

-- Drop any existing problematic indexes first
DROP INDEX IF EXISTS content_cache_recent_idx;
DROP INDEX IF EXISTS content_cache_recent_partial_idx;
DROP INDEX IF EXISTS query_cache_frequent_idx;

-- Basic lookup indexes (always safe)
CREATE INDEX IF NOT EXISTS textbook_embeddings_grade_idx
ON textbook_embeddings (grade_level)
WHERE grade_level IS NOT NULL;

CREATE INDEX IF NOT EXISTS content_cache_user_topic_idx
ON content_cache (user_id, topic_id);

CREATE INDEX IF NOT EXISTS query_cache_hash_idx
ON query_embedding_cache (query_hash);

-- Simple indexes without predicates (no immutable function issues)
CREATE INDEX IF NOT EXISTS content_cache_created_idx
ON content_cache (created_at DESC);

CREATE INDEX IF NOT EXISTS content_cache_topic_created_idx
ON content_cache (topic_id, created_at DESC);

CREATE INDEX IF NOT EXISTS query_cache_last_used_idx
ON query_embedding_cache (last_used_at DESC)
WHERE last_used_at IS NOT NULL;

-- Index for textbook metadata queries
CREATE INDEX IF NOT EXISTS textbook_embeddings_file_idx
ON textbook_embeddings ((metadata->>'file_name'))
WHERE metadata->>'file_name' IS NOT NULL;

-- Analyze tables after index creation
ANALYZE textbook_embeddings;
ANALYZE content_cache;
ANALYZE query_embedding_cache;

SELECT 'Step 2 complete: Essential indexes created (safe version)' AS status;
