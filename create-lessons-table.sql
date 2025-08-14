-- Ensure required extension for UUID generation
create extension if not exists pgcrypto;

-- Lessons table and RLS policies (Option A)
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled Lesson',
  topic text,
  grade_level int,
  vanta_effect text default 'globe',
  layout_json jsonb not null default '{}',
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.lessons enable row level security;

-- Policies
-- 1) Owners (teachers) can select their own rows; everyone can select published
drop policy if exists "select_own_or_published" on public.lessons;
create policy "select_own_or_published" on public.lessons
for select
using (
  auth.uid() = owner_id
  or status = 'published'
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text in ('ADMIN','DEVELOPER'))
);

-- 2) Insert: any authenticated teacher/admin/dev can insert; owner_id must be their uid
drop policy if exists "insert_own" on public.lessons;
create policy "insert_own" on public.lessons
for insert with check (
  auth.uid() = owner_id
);

-- 3) Update: owners can update their rows; admins/devs can update any
drop policy if exists "update_own_or_admin" on public.lessons;
create policy "update_own_or_admin" on public.lessons
for update using (
  auth.uid() = owner_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text in ('ADMIN','DEVELOPER'))
) with check (
  auth.uid() = owner_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text in ('ADMIN','DEVELOPER'))
);

-- 4) Delete: owners or admins/developers
drop policy if exists "delete_own_or_admin" on public.lessons;
create policy "delete_own_or_admin" on public.lessons
for delete using (
  auth.uid() = owner_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text in ('ADMIN','DEVELOPER'))
);

-- Trigger to auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_lessons_updated_at on public.lessons;
create trigger trg_lessons_updated_at
before update on public.lessons
for each row execute function public.set_updated_at();
