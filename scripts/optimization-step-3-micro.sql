-- STEP 3 MICRO: Absolute minimal vector index for extreme memory constraints
-- This should work even on Supabase free tier with very small datasets

DO $$
DECLARE
    embedding_count INTEGER;
    sample_embedding vector(1536);
BEGIN
    -- Check how much data we have
    SELECT COUNT(*) INTO embedding_count FROM textbook_embeddings;
    
    IF embedding_count < 20 THEN
        RAISE NOTICE 'Too few embeddings (%) for vector index', embedding_count;
    ELSIF embedding_count > 500 THEN
        RAISE NOTICE 'Too many embeddings (%) for Supabase free tier vector index', embedding_count;
    ELSE
        -- Test if we can get a sample embedding
        SELECT embedding INTO sample_embedding 
        FROM textbook_embeddings 
        WHERE embedding IS NOT NULL 
        LIMIT 1;
        
        IF sample_embedding IS NULL THEN
            RAISE NOTICE 'No valid embeddings found';
        ELSE
            RAISE NOTICE 'Attempting micro vector index for % embeddings', embedding_count;
            
            -- Drop existing vector indexes
            DROP INDEX IF EXISTS textbook_embeddings_embedding_idx;
            DROP INDEX IF EXISTS textbook_embeddings_embedding_optimized_idx;
            DROP INDEX IF EXISTS textbook_embeddings_vector_idx;
            DROP INDEX IF EXISTS textbook_embeddings_vector_safe_idx;
            DROP INDEX IF EXISTS textbook_embeddings_vector_minimal_idx;
            
            -- Create the smallest possible vector index
            -- Using only 3 lists for absolute minimal memory usage
            BEGIN
                CREATE INDEX textbook_embeddings_vector_micro_idx 
                ON textbook_embeddings 
                USING ivfflat (embedding vector_cosine_ops) 
                WITH (lists = 3);
                
                RAISE NOTICE 'Micro vector index created successfully with 3 lists';
                
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Vector index creation failed: %', SQLERRM;
                RAISE NOTICE 'Your Supabase instance cannot support vector indexes';
                RAISE NOTICE 'Using fallback search strategy instead';
                
                -- Create fallback indexes for non-vector search
                CREATE INDEX IF NOT EXISTS textbook_embeddings_text_search_idx
                ON textbook_embeddings USING gin(to_tsvector('english', content));
                
                CREATE INDEX IF NOT EXISTS textbook_embeddings_grade_content_idx
                ON textbook_embeddings (grade_level, chunk_index);
            END;
        END IF;
    END IF;
    
    -- Always ensure we have basic search capability
    CREATE INDEX IF NOT EXISTS textbook_embeddings_basic_search_idx
    ON textbook_embeddings (grade_level)
    WHERE grade_level IS NOT NULL AND embedding IS NOT NULL;
    
END $$;

SELECT 'Step 3 micro complete: Minimal vector optimization attempted' AS status;
