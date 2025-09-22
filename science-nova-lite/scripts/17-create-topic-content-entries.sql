-- 17-create-topic-content-entries.sql
-- Phase 1: Table to store Arcade (games/quizzes/flashcards) & Discovery (facts/info) content.

-- ENUM types (use CREATE TYPE IF NOT EXISTS pattern via DO block for idempotence)
DO $$ BEGIN
    CREATE TYPE content_category AS ENUM ('ARCADE','DISCOVERY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE content_subtype AS ENUM ('QUIZ','FLASHCARDS','GAME','FACT','INFO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE content_difficulty AS ENUM ('EASY','MEDIUM','HARD');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE content_status AS ENUM ('draft','published');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.topic_content_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  category content_category NOT NULL,
  subtype content_subtype NOT NULL,
  title TEXT,
  payload JSONB NOT NULL,
  difficulty content_difficulty,
  status content_status NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  version INT NOT NULL DEFAULT 1,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.tce_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS tce_set_updated_at ON public.topic_content_entries;
CREATE TRIGGER tce_set_updated_at
BEFORE UPDATE ON public.topic_content_entries
FOR EACH ROW EXECUTE FUNCTION public.tce_set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tce_topic_category_published ON public.topic_content_entries(topic_id, category) WHERE status='published';
CREATE INDEX IF NOT EXISTS idx_tce_category_subtype ON public.topic_content_entries(category, subtype, status);
CREATE INDEX IF NOT EXISTS idx_tce_created_by ON public.topic_content_entries(created_by);
CREATE INDEX IF NOT EXISTS idx_tce_payload_gin ON public.topic_content_entries USING GIN (payload jsonb_path_ops);

-- Enable RLS
ALTER TABLE public.topic_content_entries ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  CREATE POLICY tce_select_published ON public.topic_content_entries
    FOR SELECT USING (
      (status = 'published') OR (auth.uid() = created_by)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY tce_insert_admin ON public.topic_content_entries
    FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('TEACHER','ADMIN','DEVELOPER'))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY tce_update_admin ON public.topic_content_entries
    FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('TEACHER','ADMIN','DEVELOPER'))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY tce_delete_admin ON public.topic_content_entries
    FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('TEACHER','ADMIN','DEVELOPER'))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Sample seed (optional) - comment out in production
-- INSERT INTO public.topic_content_entries(topic_id, category, subtype, title, payload, status, created_by, ai_generated)
-- SELECT t.id, 'ARCADE','FLASHCARDS','Sample Flashcards', '{"cards":[{"front":"Atom","back":"Smallest unit of matter"}]}'::jsonb, 'published', p.id, true
-- FROM topics t CROSS JOIN LATERAL (SELECT id FROM profiles LIMIT 1) p LIMIT 1;
