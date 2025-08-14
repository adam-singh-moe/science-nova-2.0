-- Step-by-step Supabase optimization
-- Run these one at a time to avoid memory issues

-- STEP 1: Basic cleanup and analysis (safe for all instances)
-- Run this first to clean up and analyze existing data
ANALYZE textbook_embeddings;
ANALYZE content_cache;
ANALYZE query_embedding_cache;

-- Clean old cache entries to free memory
DELETE FROM content_cache WHERE created_at < CURRENT_DATE - INTERVAL '30 days';
DELETE FROM query_embedding_cache WHERE last_used_at < CURRENT_DATE - INTERVAL '7 days';

SELECT 'Step 1 complete: Basic cleanup and analysis' AS status;
