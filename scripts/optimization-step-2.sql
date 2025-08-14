-- STEP 2: Essential non-vector indexes (low memory usage)
-- These indexes are safe for Supabase memory constraints

-- Basic lookup indexes
CREATE INDEX IF NOT EXISTS textbook_embeddings_grade_idx
ON textbook_embeddings (grade_level)
WHERE grade_level IS NOT NULL;

CREATE INDEX IF NOT EXISTS content_cache_user_topic_idx
ON content_cache (user_id, topic_id);

CREATE INDEX IF NOT EXISTS query_cache_hash_idx
ON query_embedding_cache (query_hash);

-- Partial indexes for hot data
-- Simple index on created_at for cache management (no date filter to avoid immutable function issue)
CREATE INDEX IF NOT EXISTS content_cache_created_idx
ON content_cache (created_at DESC);

-- Index for active/recent queries (no time-based filter)
CREATE INDEX IF NOT EXISTS query_cache_usage_idx
ON query_embedding_cache (last_used_at DESC)
WHERE last_used_at IS NOT NULL;

SELECT 'Step 2 complete: Essential indexes created' AS status;
