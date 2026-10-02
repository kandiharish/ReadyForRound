-- 007: error log, so we can see problems students hit (server crashes, browser errors)

create table public.app_errors (
  id bigint generated always as identity primary key,
  source text not null check (source in ('server', 'client')),
  message text not null,
  stack text,
  path text,                 -- the page or API address where it happened
  user_id uuid references auth.users (id) on delete set null,
  user_agent text,           -- which browser / device
  created_at timestamptz not null default now()
);

create index app_errors_recent_idx on public.app_errors (created_at desc);

-- Security on, with no policies: students can't read it. Only the server (secret key) writes and reads it.
alter table public.app_errors enable row level security;
