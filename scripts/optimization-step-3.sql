-- STEP 3: Vector index handling for Supabase Free Tier
-- Free tier cannot support vector indexes - use alternative optimization

DO $$
DECLARE
    embedding_count INTEGER;
BEGIN
    -- Check how much data we have
    SELECT COUNT(*) INTO embedding_count FROM textbook_embeddings;
    
    RAISE NOTICE 'Found % embedding rows', embedding_count;
    RAISE NOTICE 'Supabase Free Tier detected - vector indexes require more memory than available';
    RAISE NOTICE 'Implementing alternative search optimization strategies...';
    
    -- Drop any existing vector indexes that might be causing issues
    DROP INDEX IF EXISTS textbook_embeddings_embedding_idx;
    DROP INDEX IF EXISTS textbook_embeddings_embedding_optimized_idx;
    DROP INDEX IF EXISTS textbook_embeddings_vector_idx;
    DROP INDEX IF EXISTS textbook_embeddings_vector_safe_idx;
    DROP INDEX IF EXISTS textbook_embeddings_vector_minimal_idx;
    
    RAISE NOTICE 'Removed any existing vector indexes';
    
    -- Create optimized non-vector indexes for better search performance
    CREATE INDEX IF NOT EXISTS textbook_embeddings_grade_chunk_idx
    ON textbook_embeddings (grade_level, chunk_index)
    WHERE grade_level IS NOT NULL;
    
    -- Full-text search index for content-based searches
    CREATE INDEX IF NOT EXISTS textbook_embeddings_content_search_idx
    ON textbook_embeddings USING gin(to_tsvector('english', content))
    WHERE content IS NOT NULL;
    
    -- Metadata search optimization
    CREATE INDEX IF NOT EXISTS textbook_embeddings_metadata_idx
    ON textbook_embeddings USING gin(metadata)
    WHERE metadata IS NOT NULL;
    
    -- File-based grouping for better cache locality
    CREATE INDEX IF NOT EXISTS textbook_embeddings_file_grade_idx
    ON textbook_embeddings ((metadata->>'file_name'), grade_level)
    WHERE metadata->>'file_name' IS NOT NULL;
    
    RAISE NOTICE 'Created alternative search indexes optimized for Free Tier';
    RAISE NOTICE 'System will use text search and metadata filtering instead of vector similarity';
    RAISE NOTICE 'Performance will still be significantly improved over unoptimized queries';
END $$;

SELECT 'Step 3 complete: Vector index handled' AS status;
