-- Content engagement events table
create table if not exists public.content_engagement_events (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references public.topic_content_entries(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete cascade,
  category text not null,
  subtype text not null,
  event_type text not null, -- open | close | complete | progress
  meta jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_content_engagement_entry on public.content_engagement_events(entry_id);
create index if not exists idx_content_engagement_topic on public.content_engagement_events(topic_id);
create index if not exists idx_content_engagement_created on public.content_engagement_events(created_at desc);

alter table public.content_engagement_events enable row level security;

-- Allow inserts from authenticated users (we keep only append events)
create policy if not exists "content_engagement_insert" on public.content_engagement_events
  for insert to authenticated with check ( auth.uid() is not null );

-- Read aggregate events (optional) - allow authenticated select
create policy if not exists "content_engagement_select" on public.content_engagement_events
  for select to authenticated using ( true );
