-- 016: Group discussion (GD) practice. The student discusses a topic with three AI classmates,
-- then gets a report on what GD evaluators look for. Messages are kept as one list per session.
create table public.gd_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  topic text not null,
  category text not null default '',
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'ended_early')),
  phase text not null default 'discussion' check (phase in ('discussion', 'summary', 'done')),
  you_started boolean not null default false,
  student_turns int not null default 0,          -- turns the student has taken (spoken, typed or passed)
  messages jsonb not null default '[]'::jsonb,   -- [{ who, text, pass?, speech? }]
  report_status text not null default 'none' check (report_status in ('none', 'generating', 'ready', 'failed')),
  report jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index gd_sessions_user_idx on public.gd_sessions (user_id, created_at desc);
-- Only the server reads and writes this table (with the secret key), so no public policies.
alter table public.gd_sessions enable row level security;
