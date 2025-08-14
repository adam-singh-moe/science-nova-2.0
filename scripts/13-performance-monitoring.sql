-- Performance monitoring table
CREATE TABLE IF NOT EXISTS api_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint TEXT NOT NULL,
    user_id UUID,
    request_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    response_time_ms INTEGER,
    cache_hit BOOLEAN DEFAULT FALSE,
    textbook_chunks_found INTEGER DEFAULT 0,
    embedding_generation_time_ms INTEGER DEFAULT 0,
    ai_generation_time_ms INTEGER DEFAULT 0,
    total_prompt_length INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    metadata JSONB
);

-- Indexes for performance analysis
CREATE INDEX IF NOT EXISTS api_performance_endpoint_idx 
ON api_performance_metrics (endpoint, request_timestamp DESC);

CREATE INDEX IF NOT EXISTS api_performance_user_idx 
ON api_performance_metrics (user_id, request_timestamp DESC);

CREATE INDEX IF NOT EXISTS api_performance_cache_idx 
ON api_performance_metrics (cache_hit, endpoint);

-- Function to get performance statistics
CREATE OR REPLACE FUNCTION get_performance_stats(
    time_window_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
    endpoint TEXT,
    avg_response_time_ms NUMERIC,
    cache_hit_rate NUMERIC,
    total_requests BIGINT,
    error_rate NUMERIC,
    avg_chunks_found NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        apm.endpoint,
        AVG(apm.response_time_ms)::NUMERIC(10,2) as avg_response_time_ms,
        (COUNT(*) FILTER (WHERE apm.cache_hit = true)::NUMERIC / COUNT(*) * 100)::NUMERIC(5,2) as cache_hit_rate,
        COUNT(*) as total_requests,
        (COUNT(*) FILTER (WHERE apm.success = false)::NUMERIC / COUNT(*) * 100)::NUMERIC(5,2) as error_rate,
        AVG(apm.textbook_chunks_found)::NUMERIC(5,2) as avg_chunks_found
    FROM api_performance_metrics apm
    WHERE apm.request_timestamp > NOW() - INTERVAL '%s hours' 
    GROUP BY apm.endpoint
    ORDER BY avg_response_time_ms DESC;
END;
$$ LANGUAGE plpgsql;
