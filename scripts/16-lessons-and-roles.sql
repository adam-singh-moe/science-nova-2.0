-- Lessons + roles setup for science-nova-lite
-- Safe to run multiple times (idempotent where possible)

-- 0) Extensions
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- 1) Ensure roles enum supports authoring roles used by the app
-- If the enum does not exist yet, create it with all values (dev envs)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t WHERE t.typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('STUDENT','TEACHER','ADMIN','DEVELOPER');
  END IF;
END$$;

-- If it exists but is missing values, add them
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type t WHERE t.typname = 'user_role') THEN
    BEGIN
      ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'TEACHER';
      ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'DEVELOPER';
      ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ADMIN';
      ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'STUDENT';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END$$;

-- 2) Profiles table (if parent project hasn't created it yet)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  role user_role NOT NULL DEFAULT 'STUDENT',
  learning_preference text DEFAULT 'VISUAL',
  created_at timestamptz DEFAULT now()
);

-- Basic RLS for profiles (no-op if exists)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- 3) Lessons table and policies (Option A layout_json approach)
CREATE TABLE IF NOT EXISTS public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled Lesson',
  topic text,
  grade_level int,
  vanta_effect text DEFAULT 'globe',
  layout_json jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft' CHECK (status in ('draft','published')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Policies (create-if-missing pattern)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='lessons' AND policyname='select_own_or_published') THEN
    DROP POLICY "select_own_or_published" ON public.lessons;
  END IF;
  CREATE POLICY "select_own_or_published" ON public.lessons
  FOR SELECT USING (
    auth.uid() = owner_id
    OR status = 'published'
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role::text IN ('ADMIN','DEVELOPER')
    )
  );

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='lessons' AND policyname='insert_own') THEN
    DROP POLICY "insert_own" ON public.lessons;
  END IF;
  CREATE POLICY "insert_own" ON public.lessons
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='lessons' AND policyname='update_own_or_admin') THEN
    DROP POLICY "update_own_or_admin" ON public.lessons;
  END IF;
  CREATE POLICY "update_own_or_admin" ON public.lessons
  FOR UPDATE USING (
    auth.uid() = owner_id OR EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text IN ('ADMIN','DEVELOPER')
    )
  ) WITH CHECK (
    auth.uid() = owner_id OR EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text IN ('ADMIN','DEVELOPER')
    )
  );

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='lessons' AND policyname='delete_own_or_admin') THEN
    DROP POLICY "delete_own_or_admin" ON public.lessons;
  END IF;
  CREATE POLICY "delete_own_or_admin" ON public.lessons
  FOR DELETE USING (
    auth.uid() = owner_id OR EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text IN ('ADMIN','DEVELOPER')
    )
  );
END $$;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lessons_updated_at ON public.lessons;
CREATE TRIGGER trg_lessons_updated_at
BEFORE UPDATE ON public.lessons
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_lessons_owner ON public.lessons(owner_id);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON public.lessons(status);
CREATE INDEX IF NOT EXISTS idx_lessons_updated_at ON public.lessons(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_lessons_grade ON public.lessons(grade_level);
-- Optional: text search accel for title/topic filtering
CREATE INDEX IF NOT EXISTS idx_lessons_title_trgm ON public.lessons USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_lessons_topic_trgm ON public.lessons USING gin (topic gin_trgm_ops);
