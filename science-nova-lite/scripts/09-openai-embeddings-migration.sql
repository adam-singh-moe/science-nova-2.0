-- Migration script to update embeddings system for OpenAI latest models
-- Supports both text-embedding-3-small (1536 dims) and text-embedding-3-large (3072 dims)

-- First, check if we need to add the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create new embeddings table with flexible dimensions support
-- We'll use 1536 dimensions to stay within pgvector limits but support both models
CREATE TABLE IF NOT EXISTS openai_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grade_level INTEGER NOT NULL CHECK (grade_level >= 1 AND grade_level <= 12),
    document_type TEXT NOT NULL CHECK (document_type IN ('textbook', 'curriculum', 'lesson_plan')),
    file_name TEXT NOT NULL,
    file_path TEXT,
    bucket_name TEXT NOT NULL DEFAULT 'textbook_content',
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    embedding vector(1536), -- Using 1536 dimensions to stay within pgvector limits
    embedding_model TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    token_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processing_status TEXT DEFAULT 'completed' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    UNIQUE(grade_level, document_type, file_name, chunk_index)
);

-- Create indexes for efficient searching
CREATE INDEX IF NOT EXISTS openai_embeddings_embedding_idx 
ON openai_embeddings USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS openai_embeddings_grade_idx 
ON openai_embeddings (grade_level);

CREATE INDEX IF NOT EXISTS openai_embeddings_document_type_idx 
ON openai_embeddings (document_type);

CREATE INDEX IF NOT EXISTS openai_embeddings_bucket_idx 
ON openai_embeddings (bucket_name);

CREATE INDEX IF NOT EXISTS openai_embeddings_file_idx 
ON openai_embeddings (file_name);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS openai_embeddings_grade_type_idx 
ON openai_embeddings (grade_level, document_type);

-- Full-text search index for fallback searches
CREATE INDEX IF NOT EXISTS openai_embeddings_content_search_idx
ON openai_embeddings USING gin(to_tsvector('english', content));

-- Create updated search function for OpenAI embeddings
CREATE OR REPLACE FUNCTION search_openai_embeddings(
    query_embedding vector(1536),
    grade_filter INTEGER DEFAULT NULL,
    document_types TEXT[] DEFAULT NULL,
    match_threshold FLOAT DEFAULT 0.7,
    match_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    metadata JSONB,
    file_name TEXT,
    document_type TEXT,
    grade_level INTEGER,
    similarity FLOAT,
    token_count INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        oe.id,
        oe.content,
        oe.metadata,
        oe.file_name,
        oe.document_type,
        oe.grade_level,
        1 - (oe.embedding <=> query_embedding) AS similarity,
        oe.token_count
    FROM openai_embeddings oe
    WHERE 
        (grade_filter IS NULL OR oe.grade_level = grade_filter)
        AND (document_types IS NULL OR oe.document_type = ANY(document_types))
        AND oe.embedding IS NOT NULL
        AND 1 - (oe.embedding <=> query_embedding) > match_threshold
    ORDER BY oe.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function to handle text-embedding-3-large (3072 dims) by truncating to 1536
CREATE OR REPLACE FUNCTION search_openai_embeddings_large(
    query_embedding_3072 vector(3072),
    grade_filter INTEGER DEFAULT NULL,
    document_types TEXT[] DEFAULT NULL,
    match_threshold FLOAT DEFAULT 0.7,
    match_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    metadata JSONB,
    file_name TEXT,
    document_type TEXT,
    grade_level INTEGER,
    similarity FLOAT,
    token_count INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    truncated_embedding vector(1536);
    i INTEGER;
BEGIN
    -- Truncate the 3072-dimensional embedding to 1536 dimensions
    -- This preserves the most important features while fitting within pgvector limits
    truncated_embedding := array_fill(0.0, ARRAY[1536])::vector;
    
    -- Copy the first 1536 dimensions
    FOR i IN 1..1536 LOOP
        truncated_embedding[i] := query_embedding_3072[i];
    END LOOP;
    
    -- Use the main search function with truncated embedding
    RETURN QUERY
    SELECT * FROM search_openai_embeddings(
        truncated_embedding,
        grade_filter,
        document_types,
        match_threshold,
        match_count
    );
END;
$$;

-- Create trigger for updating timestamp
CREATE OR REPLACE FUNCTION update_openai_embeddings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_openai_embeddings_modtime
BEFORE UPDATE ON openai_embeddings
FOR EACH ROW EXECUTE FUNCTION update_openai_embeddings_timestamp();

-- Create view for easy querying of embeddings with metadata
CREATE OR REPLACE VIEW openai_embeddings_summary AS
SELECT 
    grade_level,
    document_type,
    bucket_name,
    COUNT(*) as chunk_count,
    COUNT(DISTINCT file_name) as file_count,
    AVG(token_count) as avg_token_count,
    MIN(created_at) as first_processed,
    MAX(updated_at) as last_updated
FROM openai_embeddings 
GROUP BY grade_level, document_type, bucket_name
ORDER BY grade_level, document_type;

-- Function to get embedding statistics
CREATE OR REPLACE FUNCTION get_openai_embeddings_stats()
RETURNS TABLE (
    total_chunks BIGINT,
    total_files BIGINT,
    chunks_by_grade JSONB,
    chunks_by_type JSONB,
    model_distribution JSONB,
    latest_processed TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_chunks,
        COUNT(DISTINCT file_name) as total_files,
        jsonb_object_agg(grade_level::text, grade_count) as chunks_by_grade,
        jsonb_object_agg(document_type, type_count) as chunks_by_type,
        jsonb_object_agg(embedding_model, model_count) as model_distribution,
        MAX(processed_at) as latest_processed
    FROM (
        SELECT 
            grade_level,
            document_type,
            embedding_model,
            processed_at,
            file_name,
            COUNT(*) OVER (PARTITION BY grade_level) as grade_count,
            COUNT(*) OVER (PARTITION BY document_type) as type_count,
            COUNT(*) OVER (PARTITION BY embedding_model) as model_count
        FROM openai_embeddings
    ) stats;
END;
$$;

-- Create embedding cache table for query optimization
CREATE TABLE IF NOT EXISTS openai_query_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_hash TEXT UNIQUE NOT NULL,
    query_text TEXT NOT NULL,
    embedding vector(1536), -- Using 1536 dimensions for consistency
    embedding_model TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    grade_level INTEGER,
    document_types TEXT[],
    usage_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for cache lookups
CREATE INDEX IF NOT EXISTS openai_query_cache_hash_idx 
ON openai_query_cache (query_hash);

CREATE INDEX IF NOT EXISTS openai_query_cache_usage_idx 
ON openai_query_cache (usage_count DESC, last_used_at DESC);

-- Function to clean old cache entries
CREATE OR REPLACE FUNCTION cleanup_openai_query_cache()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Keep only the 1000 most recently used cache entries
    DELETE FROM openai_query_cache 
    WHERE id NOT IN (
        SELECT id FROM openai_query_cache 
        ORDER BY last_used_at DESC 
        LIMIT 1000
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Function to increment query usage count
CREATE OR REPLACE FUNCTION increment_query_usage(hash_value TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE openai_query_cache 
    SET usage_count = usage_count + 1
    WHERE query_hash = hash_value;
END;
$$;

-- Create processing status table for tracking document processing
CREATE TABLE IF NOT EXISTS document_processing_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_path TEXT UNIQUE NOT NULL,
    file_name TEXT NOT NULL,
    bucket_name TEXT NOT NULL,
    grade_level INTEGER,
    document_type TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retry')),
    chunks_created INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    embedding_model TEXT,
    error_message TEXT,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for processing status
CREATE INDEX IF NOT EXISTS document_processing_status_file_path_idx 
ON document_processing_status (file_path);

CREATE INDEX IF NOT EXISTS document_processing_status_status_idx 
ON document_processing_status (status);

CREATE INDEX IF NOT EXISTS document_processing_status_bucket_grade_idx 
ON document_processing_status (bucket_name, grade_level);

-- Function to update processing status
CREATE OR REPLACE FUNCTION update_document_processing_status(
    p_file_path TEXT,
    p_status TEXT,
    p_chunks_created INTEGER DEFAULT NULL,
    p_total_tokens INTEGER DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE document_processing_status 
    SET 
        status = p_status,
        chunks_created = COALESCE(p_chunks_created, chunks_created),
        total_tokens = COALESCE(p_total_tokens, total_tokens),
        error_message = p_error_message,
        processing_completed_at = CASE WHEN p_status IN ('completed', 'failed') THEN NOW() ELSE processing_completed_at END,
        updated_at = NOW()
    WHERE file_path = p_file_path;
    
    -- Insert if not exists
    IF NOT FOUND THEN
        INSERT INTO document_processing_status (
            file_path, 
            file_name, 
            bucket_name, 
            status, 
            chunks_created, 
            total_tokens, 
            error_message,
            processing_completed_at
        ) VALUES (
            p_file_path,
            split_part(p_file_path, '/', -1), -- Extract filename from path
            split_part(p_file_path, '/', 1),  -- Extract bucket from path
            p_status,
            p_chunks_created,
            p_total_tokens,
            p_error_message,
            CASE WHEN p_status IN ('completed', 'failed') THEN NOW() ELSE NULL END
        );
    END IF;
END;
$$;

-- Create RLS policies (if RLS is enabled)
ALTER TABLE openai_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE openai_query_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_processing_status ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read embeddings
CREATE POLICY "Allow authenticated read on openai_embeddings" 
ON openai_embeddings FOR SELECT 
TO authenticated 
USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access on openai_embeddings" 
ON openai_embeddings FOR ALL 
TO service_role 
USING (true);

-- Similar policies for other tables
CREATE POLICY "Allow authenticated read on openai_query_cache" 
ON openai_query_cache FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow service role full access on openai_query_cache" 
ON openai_query_cache FOR ALL 
TO service_role 
USING (true);

CREATE POLICY "Allow authenticated read on document_processing_status" 
ON document_processing_status FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow service role full access on document_processing_status" 
ON document_processing_status FOR ALL 
TO service_role 
USING (true);

-- Create a function to migrate existing textbook_embeddings to new format
CREATE OR REPLACE FUNCTION migrate_textbook_embeddings_to_openai()
RETURNS TABLE (
    migrated_count INTEGER,
    skipped_count INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    migrated INTEGER := 0;
    skipped INTEGER := 0;
    embedding_record RECORD;
BEGIN
    -- Loop through existing textbook_embeddings
    FOR embedding_record IN 
        SELECT * FROM textbook_embeddings 
        WHERE embedding IS NOT NULL
    LOOP
        -- Check if already migrated
        IF EXISTS (
            SELECT 1 FROM openai_embeddings 
            WHERE grade_level = embedding_record.grade_level 
            AND file_name = embedding_record.file_name 
            AND chunk_index = embedding_record.chunk_index
        ) THEN
            skipped := skipped + 1;
            CONTINUE;
        END IF;
        
        -- Insert into new table (existing embeddings are already 1536 dimensions)
        INSERT INTO openai_embeddings (
            grade_level,
            document_type,
            file_name,
            chunk_index,
            content,
            metadata,
            embedding,
            embedding_model,
            bucket_name,
            created_at,
            updated_at,
            processed_at
        ) VALUES (
            embedding_record.grade_level,
            'textbook',
            embedding_record.file_name,
            embedding_record.chunk_index,
            embedding_record.content,
            embedding_record.metadata,
            embedding_record.embedding, -- Direct copy since dimensions match
            'google-text-embedding-004-migrated',
            'textbook_content',
            embedding_record.created_at,
            embedding_record.updated_at,
            embedding_record.created_at
        );
        
        migrated := migrated + 1;
    END LOOP;
    
    RETURN QUERY SELECT migrated, skipped;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON openai_embeddings TO authenticated, anon, service_role;
GRANT ALL ON openai_query_cache TO authenticated, anon, service_role;
GRANT ALL ON document_processing_status TO authenticated, anon, service_role;
GRANT SELECT ON openai_embeddings_summary TO authenticated, anon, service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION search_openai_embeddings TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION search_openai_embeddings_large TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_openai_embeddings_stats TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION cleanup_openai_query_cache TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION update_document_processing_status TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION migrate_textbook_embeddings_to_openai TO authenticated, anon, service_role;

-- Final comment
COMMENT ON TABLE openai_embeddings IS 'Stores document embeddings using OpenAI models (optimized for text-embedding-3-small with 1536 dimensions to work within pgvector limits)';
COMMENT ON TABLE openai_query_cache IS 'Caches frequently used query embeddings to improve performance';
COMMENT ON TABLE document_processing_status IS 'Tracks the processing status of documents through the embedding pipeline';