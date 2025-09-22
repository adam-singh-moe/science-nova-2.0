-- 19-discovery-arcade-admin-enhancements.sql
-- Adds convenience generated columns & indexes for Discovery facts and admin visibility improvements.
-- Also creates lightweight views for admin tooling.

-- Generated columns (safe idempotent pattern)
ALTER TABLE public.topic_content_entries
  ADD COLUMN IF NOT EXISTS preview_text TEXT GENERATED ALWAYS AS (
    COALESCE(payload->>'preview', payload->>'text')
  ) STORED,
  ADD COLUMN IF NOT EXISTS detail_text TEXT GENERATED ALWAYS AS (
    COALESCE(payload->>'detail', payload->>'text')
  ) STORED,
  ADD COLUMN IF NOT EXISTS source_text TEXT GENERATED ALWAYS AS (
    COALESCE(payload->>'source','')
  ) STORED;

-- Indexes to speed Discovery search / listing
CREATE INDEX IF NOT EXISTS idx_tce_discovery_preview_trgm
  ON public.topic_content_entries USING GIN (preview_text gin_trgm_ops)
  WHERE category = 'DISCOVERY';

CREATE INDEX IF NOT EXISTS idx_tce_discovery_detail_trgm
  ON public.topic_content_entries USING GIN (detail_text gin_trgm_ops)
  WHERE category = 'DISCOVERY';

-- Allow admin/teacher/developer to see all (including draft) entries
DO $$ BEGIN
  CREATE POLICY tce_select_admin_all ON public.topic_content_entries
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('TEACHER','ADMIN','DEVELOPER')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Convenience views for admin UI (drop/create to update definition)
DROP VIEW IF EXISTS public.admin_discovery_facts CASCADE;
CREATE VIEW public.admin_discovery_facts AS
SELECT tce.id,
       tce.topic_id,
       tp.title AS topic_title,
       tp.grade_level,
       tce.title,
       tce.preview_text,
       tce.detail_text,
       tce.source_text,
       tce.status,
       tce.created_at,
       tce.updated_at
FROM public.topic_content_entries tce
JOIN public.topics tp ON tp.id = tce.topic_id
WHERE tce.category = 'DISCOVERY';

DROP VIEW IF EXISTS public.admin_arcade_entries CASCADE;
CREATE VIEW public.admin_arcade_entries AS
SELECT tce.id,
       tce.topic_id,
       tp.title AS topic_title,
       tp.grade_level,
       tce.subtype,
       tce.title,
       tce.status,
       tce.created_at,
       tce.updated_at
FROM public.topic_content_entries tce
JOIN public.topics tp ON tp.id = tce.topic_id
WHERE tce.category = 'ARCADE';

-- Grant select on views to authenticated users (RLS still applies underneath)
GRANT SELECT ON public.admin_discovery_facts TO authenticated;
GRANT SELECT ON public.admin_arcade_entries TO authenticated;

COMMENT ON VIEW public.admin_discovery_facts IS 'Admin/teacher listing of discovery (fact/info) entries with preview & detail generated columns';
COMMENT ON VIEW public.admin_arcade_entries IS 'Admin/teacher listing of arcade entries (quiz/flashcards/game)';
