-- STEP 4: Functions and maintenance settings (safe)
-- Create optimized functions and set maintenance parameters

-- Memory-efficient search function
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
    -- Efficient search with proper limits
    RETURN QUERY
    SELECT
        te.id,
        te.content,
        te.metadata,
        (1 - (te.embedding <=> query_embedding)) AS similarity
    FROM textbook_embeddings te
    WHERE
        te.grade_level = grade_filter
        AND te.embedding IS NOT NULL
        AND (1 - (te.embedding <=> query_embedding)) > match_threshold
    ORDER BY te.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Simple stats view (no materialized view)
CREATE OR REPLACE VIEW textbook_content_stats AS
SELECT 
    grade_level,
    COUNT(*) as chunk_count,
    COUNT(DISTINCT COALESCE(metadata->>'file_name', 'unknown')) as file_count,
    MAX(created_at) as last_processed
FROM textbook_embeddings
WHERE grade_level IS NOT NULL
GROUP BY grade_level;

-- Conservative maintenance settings for Supabase
ALTER TABLE textbook_embeddings SET (
    autovacuum_vacuum_scale_factor = 0.2,
    autovacuum_analyze_scale_factor = 0.1
);

ALTER TABLE content_cache SET (
    autovacuum_vacuum_scale_factor = 0.3,
    autovacuum_analyze_scale_factor = 0.15
);

-- Final analysis
ANALYZE textbook_embeddings;
ANALYZE content_cache;
ANALYZE query_embedding_cache;

SELECT 'Step 4 complete: Functions and maintenance configured' AS status;
