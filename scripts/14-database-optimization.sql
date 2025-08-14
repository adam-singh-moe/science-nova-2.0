-- Optimize vector search performance
-- Improve indexing for faster similarity searches

-- Update vector index with better configuration
DROP INDEX IF EXISTS textbook_embeddings_embedding_idx;

-- Create optimized ivfflat index with memory-conscious configuration for Supabase
-- Reduced lists to fit within maintenance_work_mem constraints
CREATE INDEX textbook_embeddings_embedding_optimized_idx
ON textbook_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 50); -- Reduced from 200 to fit Supabase memory limits

-- Add composite indexes for common query patterns (memory-optimized)
-- Simplified composite index to reduce memory usage
CREATE INDEX IF NOT EXISTS textbook_embeddings_grade_idx
ON textbook_embeddings (grade_level);

-- Separate index for embedding operations (more memory efficient)
CREATE INDEX IF NOT EXISTS textbook_embeddings_content_search_idx
ON textbook_embeddings (grade_level, chunk_index);

-- Optimize content cache table
CREATE INDEX IF NOT EXISTS content_cache_user_topic_idx
ON content_cache (user_id, topic_id, created_at DESC);

-- Add partial index for recent cache entries (most commonly accessed)
CREATE INDEX IF NOT EXISTS content_cache_recent_idx
ON content_cache (topic_id, user_id)
WHERE created_at > NOW() - INTERVAL '7 days';

-- Optimize query embedding cache
CREATE INDEX IF NOT EXISTS query_embedding_cache_recent_idx
ON query_embedding_cache (query_hash, last_used_at DESC)
WHERE last_used_at > NOW() - INTERVAL '1 day';

-- Update table statistics for better query planning
ANALYZE textbook_embeddings;
ANALYZE content_cache;
ANALYZE query_embedding_cache;

-- Optimize search function with better performance
CREATE OR REPLACE FUNCTION search_similar_textbook_content_optimized(
    query_embedding vector(1536),
    grade_filter INTEGER,
    match_threshold FLOAT DEFAULT 0.6,
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
    -- Use limit and early termination for better performance
    RETURN QUERY
    SELECT
        te.id,
        te.content,
        te.metadata,
        (1 - (te.embedding <=> query_embedding)) AS similarity
    FROM textbook_embeddings te
    WHERE
        te.grade_level = grade_filter
        AND (1 - (te.embedding <=> query_embedding)) > match_threshold
    ORDER BY te.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Create materialized view for content statistics (updated periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS textbook_content_stats AS
SELECT 
    grade_level,
    COUNT(*) as chunk_count,
    COUNT(DISTINCT file_name) as file_count,
    MAX(created_at) as last_processed,
    AVG(LENGTH(content)) as avg_chunk_length
FROM textbook_embeddings
GROUP BY grade_level;

-- Create index on materialized view
CREATE UNIQUE INDEX textbook_content_stats_grade_idx 
ON textbook_content_stats (grade_level);

-- Function to refresh stats (call periodically)
CREATE OR REPLACE FUNCTION refresh_textbook_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY textbook_content_stats;
END;
$$ LANGUAGE plpgsql;

-- Auto-vacuum and analyze settings for better maintenance
ALTER TABLE textbook_embeddings SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE content_cache SET (
    autovacuum_vacuum_scale_factor = 0.2,
    autovacuum_analyze_scale_factor = 0.1
);
