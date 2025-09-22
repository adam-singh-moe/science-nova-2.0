-- 23-soft-delete-topic-content-entries.sql
-- Adds deleted_at column for soft delete and supporting partial index.

ALTER TABLE public.topic_content_entries
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_tce_not_deleted_created_at ON public.topic_content_entries(created_at DESC) WHERE deleted_at IS NULL;

COMMENT ON COLUMN public.topic_content_entries.deleted_at IS 'Timestamp of soft deletion (null means active)';
