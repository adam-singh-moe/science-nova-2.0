-- Lesson activity telemetry table
create table if not exists public.lesson_activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  block_id text,
  tool_kind text, -- 'LESSON' | 'TEXT' | 'FLASHCARDS' | 'QUIZ' | 'CROSSWORD' | 'IMAGE'
  event_type text not null, -- see API docs
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_lae_user_created on public.lesson_activity_events(user_id, created_at desc);
create index if not exists idx_lae_user_lesson on public.lesson_activity_events(user_id, lesson_id);
create index if not exists idx_lae_event_type on public.lesson_activity_events(event_type);

-- Enable RLS and policies
alter table public.lesson_activity_events enable row level security;

do $$ begin
  if not exists (
  select 1 from pg_policies where policyname = 'lae_insert_own'
  ) then
    create policy lae_insert_own on public.lesson_activity_events
      for insert to authenticated
      with check (user_id = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (
  select 1 from pg_policies where policyname = 'lae_select_own'
  ) then
    create policy lae_select_own on public.lesson_activity_events
      for select to authenticated
      using (user_id = auth.uid());
  end if;
end $$;
