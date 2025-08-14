-- Supabase-optimized database performance script
-- Memory-conscious optimizations for hosted Supabase instances

-- Step 1: Basic performance optimizations (low memory usage)
-- Update table statistics first (essential for query planning)
ANALYZE textbook_embeddings;
ANALYZE content_cache;
ANALYZE query_embedding_cache;

-- Step 2: Essential indexes only (memory efficient)
-- Simple grade level index for filtering
CREATE INDEX IF NOT EXISTS textbook_embeddings_grade_simple_idx
ON textbook_embeddings (grade_level)
WHERE grade_level IS NOT NULL;

-- Content cache optimization
CREATE INDEX IF NOT EXISTS content_cache_lookup_idx
ON content_cache (user_id, topic_id);

-- Query cache optimization  
CREATE INDEX IF NOT EXISTS query_embedding_cache_lookup_idx
ON query_embedding_cache (query_hash);

-- Step 3: Partial indexes for hot data (memory efficient)
-- Index only recent cache entries (most commonly accessed)
CREATE INDEX IF NOT EXISTS content_cache_recent_partial_idx
ON content_cache (topic_id, created_at DESC);

-- Index only frequently used query cache
CREATE INDEX IF NOT EXISTS query_cache_frequent_idx  
ON query_embedding_cache (query_hash, usage_count DESC)
WHERE usage_count > 1;

-- Step 4: Memory-conscious vector index
-- Check if we have enough data to warrant a vector index
DO $$
DECLARE
    embedding_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO embedding_count FROM textbook_embeddings;
    
    -- Only create vector index if we have sufficient data and it's worth the memory cost
    IF embedding_count > 100 THEN
        -- Drop existing index if it exists
        DROP INDEX IF EXISTS textbook_embeddings_embedding_idx;
        DROP INDEX IF EXISTS textbook_embeddings_embedding_optimized_idx;
        
        -- Create memory-efficient vector index
        -- Using minimal lists to stay within Supabase memory limits
        RAISE NOTICE 'Creating vector index for % embeddings', embedding_count;
        
        -- Use smaller list count for Supabase constraints
        EXECUTE format('CREATE INDEX textbook_embeddings_vector_idx 
                       ON textbook_embeddings 
                       USING ivfflat (embedding vector_cosine_ops) 
                       WITH (lists = %s)', 
                       LEAST(embedding_count / 10, 25)); -- Max 25 lists for memory safety
    ELSE
        RAISE NOTICE 'Skipping vector index creation - insufficient data (% rows)', embedding_count;
    END IF;
END $$;

-- Step 5: Optimized search function (memory conscious)
CREATE OR REPLACE FUNCTION search_textbook_content_safe(
    query_embedding vector(1536),
    grade_filter INTEGER DEFAULT NULL,
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
    -- Memory-efficient search with proper filtering
    RETURN QUERY
    SELECT
        te.id,
        te.content,
        te.metadata,
        (1 - (te.embedding <=> query_embedding)) AS similarity
    FROM textbook_embeddings te
    WHERE
        (grade_filter IS NULL OR te.grade_level = grade_filter)
        AND te.embedding IS NOT NULL  -- Safety check
    ORDER BY te.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Step 6: Simple statistics view (no materialized view to save memory)
CREATE OR REPLACE VIEW textbook_stats_simple AS
SELECT 
    grade_level,
    COUNT(*) as chunk_count,
    COUNT(DISTINCT COALESCE(metadata->>'file_name', 'unknown')) as estimated_files,
    MAX(created_at) as last_processed
FROM textbook_embeddings
WHERE grade_level IS NOT NULL
GROUP BY grade_level
ORDER BY grade_level;

-- Step 7: Maintenance settings (conservative for Supabase)
-- More frequent but lighter maintenance
ALTER TABLE textbook_embeddings SET (
    autovacuum_vacuum_scale_factor = 0.15,  -- More conservative
    autovacuum_analyze_scale_factor = 0.08,
    autovacuum_vacuum_cost_limit = 200      -- Limit vacuum cost
);

ALTER TABLE content_cache SET (
    autovacuum_vacuum_scale_factor = 0.25,  -- Even more conservative for cache
    autovacuum_analyze_scale_factor = 0.15
);

-- Step 8: Clean up old cache entries to free memory
-- Remove cache entries older than 30 days (using DELETE, not index predicate)
DO $$
BEGIN
    -- Clean up old cache entries
    DELETE FROM content_cache 
    WHERE created_at < CURRENT_DATE - INTERVAL '30 days';
    
    -- Remove unused query cache entries
    DELETE FROM query_embedding_cache 
    WHERE last_used_at < CURRENT_DATE - INTERVAL '7 days' 
       OR last_used_at IS NULL;
    
    RAISE NOTICE 'Cache cleanup completed';
END $$;

-- Final analysis after cleanup
ANALYZE textbook_embeddings;
ANALYZE content_cache;
ANALYZE query_embedding_cache;

-- Report current status
DO $$
DECLARE
    embedding_count INTEGER;
    cache_count INTEGER;
    query_cache_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO embedding_count FROM textbook_embeddings;
    SELECT COUNT(*) INTO cache_count FROM content_cache;
    SELECT COUNT(*) INTO query_cache_count FROM query_embedding_cache;
    
    RAISE NOTICE 'Optimization complete:';
    RAISE NOTICE '- Textbook embeddings: % rows', embedding_count;
    RAISE NOTICE '- Content cache: % entries', cache_count;
    RAISE NOTICE '- Query cache: % entries', query_cache_count;
    RAISE NOTICE 'All indexes created within Supabase memory constraints';
END $$;
