-- 24-update-admin-content-views-paging.sql
-- Recreate admin views to include deleted_at and allow ordering/pagination client-side.

DROP VIEW IF EXISTS public.admin_discovery_facts CASCADE;
CREATE VIEW public.admin_discovery_facts AS
SELECT tce.id,
       tce.topic_id,
       tp.title AS topic_title,
       tp.grade_level,
       tce.subtype,
       tce.title,
       tce.preview_text,
       tce.detail_text,
       tce.source_text,
       tce.status,
       tce.deleted_at,
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
       tce.deleted_at,
       tce.created_at,
       tce.updated_at
FROM public.topic_content_entries tce
JOIN public.topics tp ON tp.id = tce.topic_id
WHERE tce.category = 'ARCADE';

GRANT SELECT ON public.admin_discovery_facts TO authenticated;
GRANT SELECT ON public.admin_arcade_entries TO authenticated;

COMMENT ON VIEW public.admin_discovery_facts IS 'Admin listing of discovery entries including deleted_at';
COMMENT ON VIEW public.admin_arcade_entries IS 'Admin listing of arcade entries including deleted_at';
