-- 22-ai-generation-rate-limit.sql
-- Introduces a simple per-user, per-endpoint minute bucket rate limiting table & function.

CREATE TABLE IF NOT EXISTS public.ai_generation_usage (
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  bucket_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, endpoint, bucket_start)
);

-- Helpful index for recent lookups (optional due to PK)
CREATE INDEX IF NOT EXISTS idx_ai_generation_usage_recent
  ON public.ai_generation_usage (endpoint, bucket_start DESC);

-- Function: attempts to increment usage; returns TRUE if allowed else FALSE.
-- Parameters:
--   p_user_id uuid
--   p_endpoint text
--   p_limit int (max allowed within bucket)
--   p_window_seconds int (bucket window length; currently coerced to minute alignment)
CREATE OR REPLACE FUNCTION public.increment_ai_generation_usage(
  p_user_id uuid,
  p_endpoint text,
  p_limit integer,
  p_window_seconds integer DEFAULT 60
) RETURNS boolean AS $$
DECLARE
  v_bucket timestamptz;
  v_count integer;
BEGIN
  -- Align bucket to the start of the current minute (simpler deterministic window)
  v_bucket := date_trunc('minute', now());
  SELECT count INTO v_count FROM ai_generation_usage
    WHERE user_id = p_user_id AND endpoint = p_endpoint AND bucket_start = v_bucket;
  IF NOT FOUND THEN
    INSERT INTO ai_generation_usage(user_id, endpoint, bucket_start, count)
      VALUES (p_user_id, p_endpoint, v_bucket, 1);
    RETURN TRUE;
  ELSIF v_count < p_limit THEN
    UPDATE ai_generation_usage
      SET count = count + 1
      WHERE user_id = p_user_id AND endpoint = p_endpoint AND bucket_start = v_bucket;
    RETURN TRUE;
  ELSE
    RETURN FALSE; -- limit exceeded
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.increment_ai_generation_usage(uuid,text,integer,integer) FROM public;
GRANT EXECUTE ON FUNCTION public.increment_ai_generation_usage(uuid,text,integer,integer) TO authenticated;

COMMENT ON TABLE public.ai_generation_usage IS 'Per-user AI generation usage buckets (minute granularity)';
COMMENT ON FUNCTION public.increment_ai_generation_usage(uuid,text,integer,integer) IS 'Atomically increments usage; returns true if within limit';
