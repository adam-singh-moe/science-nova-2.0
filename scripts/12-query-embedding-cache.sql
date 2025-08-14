-- Add query embedding cache table
CREATE TABLE IF NOT EXISTS query_embedding_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_hash TEXT UNIQUE NOT NULL,
    query_text TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    grade_level INTEGER,
    study_area TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usage_count INTEGER DEFAULT 1
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS query_embedding_cache_hash_idx 
ON query_embedding_cache (query_hash);

-- Index for cleanup operations
CREATE INDEX IF NOT EXISTS query_embedding_cache_usage_idx 
ON query_embedding_cache (last_used_at, usage_count);

-- Function to update usage statistics
CREATE OR REPLACE FUNCTION update_query_cache_usage(hash_value TEXT)
RETURNS void AS $$
BEGIN
    UPDATE query_embedding_cache 
    SET last_used_at = NOW(), usage_count = usage_count + 1
    WHERE query_hash = hash_value;
END;
$$ LANGUAGE plpgsql;
