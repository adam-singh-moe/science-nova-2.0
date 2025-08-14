-- STEP 3 ALTERNATIVE: Skip vector index for Supabase free tier
-- Use alternative optimization strategies when vector indexes won't fit

DO $$
DECLARE
    embedding_count INTEGER;
BEGIN
    -- Check how much data we have
    SELECT COUNT(*) INTO embedding_count FROM textbook_embeddings;
    
    RAISE NOTICE 'Found % embedding rows', embedding_count;
    
    IF embedding_count < 50 THEN
        RAISE NOTICE 'Insufficient data for any vector optimization';
    ELSE
        RAISE NOTICE 'Vector index requires too much memory for Supabase free tier';
        RAISE NOTICE 'Using alternative optimization strategies...';
        
        -- Drop any existing vector indexes that might be causing issues
        DROP INDEX IF EXISTS textbook_embeddings_embedding_idx;
        DROP INDEX IF EXISTS textbook_embeddings_embedding_optimized_idx;
        DROP INDEX IF EXISTS textbook_embeddings_vector_idx;
        DROP INDEX IF EXISTS textbook_embeddings_vector_safe_idx;
        DROP INDEX IF EXISTS textbook_embeddings_vector_minimal_idx;
        
        -- Create alternative indexes for better performance without vectors
        CREATE INDEX IF NOT EXISTS textbook_embeddings_search_fallback_idx
        ON textbook_embeddings (grade_level, chunk_index, file_name);
        
        -- Index for content-based searches (when vector search isn't available)
        CREATE INDEX IF NOT EXISTS textbook_embeddings_content_text_idx
        ON textbook_embeddings USING gin(to_tsvector('english', content));
        
        -- Index for metadata searches
        CREATE INDEX IF NOT EXISTS textbook_embeddings_metadata_gin_idx
        ON textbook_embeddings USING gin(metadata);
        
        RAISE NOTICE 'Alternative search indexes created successfully';
        RAISE NOTICE 'System will use text search and metadata filtering instead of vector similarity';
    END IF;
END $$;

SELECT 'Step 3 alternative complete: Non-vector optimization applied' AS status;
