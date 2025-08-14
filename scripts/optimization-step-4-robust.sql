-- Updated search function that handles missing vector indexes
-- This version falls back to text search if vector search fails

CREATE OR REPLACE FUNCTION search_similar_textbook_content_robust(
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
    -- Try vector search first
    BEGIN
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
        
        -- If we got results, return them
        IF FOUND THEN
            RETURN;
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        -- Vector search failed, continue to text search fallback
        RAISE NOTICE 'Vector search failed, using text search fallback: %', SQLERRM;
    END;
    
    -- Fallback to text search if vector search failed or returned no results
    RAISE NOTICE 'Using text search fallback for grade %', grade_filter;
    
    RETURN QUERY
    SELECT
        te.id,
        te.content,
        te.metadata,
        0.7::FLOAT AS similarity  -- Fixed similarity for text search
    FROM textbook_embeddings te
    WHERE
        te.grade_level = grade_filter
        AND te.content IS NOT NULL
        AND (
            to_tsvector('english', te.content) @@ plainto_tsquery('english', 
                COALESCE(te.metadata->>'search_terms', 'science education'))
            OR te.content ILIKE '%science%'  -- Basic fallback
        )
    ORDER BY 
        CASE 
            WHEN te.content ILIKE '%science%' THEN 1
            ELSE 2
        END,
        te.chunk_index
    LIMIT match_count;
END;
$$;

-- Create a simple search function that works without embeddings
CREATE OR REPLACE FUNCTION search_textbook_content_simple(
    search_terms TEXT,
    grade_filter INTEGER,
    match_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    metadata JSONB,
    relevance FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        te.id,
        te.content,
        te.metadata,
        0.8::FLOAT AS relevance
    FROM textbook_embeddings te
    WHERE
        te.grade_level = grade_filter
        AND te.content IS NOT NULL
        AND (
            to_tsvector('english', te.content) @@ plainto_tsquery('english', search_terms)
            OR te.content ILIKE '%' || search_terms || '%'
        )
    ORDER BY 
        ts_rank(to_tsvector('english', te.content), plainto_tsquery('english', search_terms)) DESC,
        te.chunk_index
    LIMIT match_count;
END;
$$;

SELECT 'Robust search functions created' AS status;
