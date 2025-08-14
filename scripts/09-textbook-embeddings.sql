-- Add vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table to store textbook content chunks and embeddings
CREATE TABLE IF NOT EXISTS textbook_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grade_level INTEGER NOT NULL CHECK (grade_level >= 1 AND grade_level <= 6),
    file_name TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    embedding vector(1536), -- OpenAI embedding dimension
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(grade_level, file_name, chunk_index)
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS textbook_embeddings_embedding_idx 
ON textbook_embeddings USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Create index for grade level filtering
CREATE INDEX IF NOT EXISTS textbook_embeddings_grade_idx 
ON textbook_embeddings (grade_level);

-- Create function to search similar content
CREATE OR REPLACE FUNCTION search_similar_textbook_content(
    query_embedding vector(1536),
    grade_filter INTEGER,
    match_threshold FLOAT DEFAULT 0.7,
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
    RETURN QUERY
    SELECT 
        te.id,
        te.content,
        te.metadata,
        1 - (te.embedding <=> query_embedding) AS similarity
    FROM textbook_embeddings te
    WHERE 
        te.grade_level = grade_filter
        AND 1 - (te.embedding <=> query_embedding) > match_threshold
    ORDER BY te.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_textbook_embeddings_modtime
BEFORE UPDATE ON textbook_embeddings
FOR EACH ROW EXECUTE FUNCTION update_modified_column();
