-- 003: interview sessions and their question/answer turns

-- One row per interview a student starts.
create table public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  mode text not null check (mode in ('single', 'complete')),
  rounds text[] not null,                      -- ordered list, e.g. {technical,hr}
  current_round_index int not null default 0,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'ended_early')),
  -- Snapshot of the student's profile when the interview started, so later
  -- profile edits don't change how this interview is understood.
  context jsonb not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index interview_sessions_user_idx on public.interview_sessions (user_id, created_at desc);

-- One row per question asked (and the student's answer to it).
create table public.interview_turns (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.interview_sessions (id) on delete cascade,
  round text not null check (round in ('technical', 'project', 'behavioural', 'hr')),
  seq int not null,                            -- 1, 2, 3... order within the whole interview
  question text not null,
  is_follow_up boolean not null default false,
  answer text,                                 -- null = not answered yet
  skipped boolean not null default false,
  asked_at timestamptz not null default now(),
  answered_at timestamptz,
  unique (session_id, seq)
);

alter table public.interview_sessions enable row level security;
alter table public.interview_turns enable row level security;

create policy "Users can read their own interview sessions"
  on public.interview_sessions for select
  using (auth.uid() = user_id);

create policy "Users can read turns of their own interviews"
  on public.interview_turns for select
  using (exists (
    select 1 from public.interview_sessions s
    where s.id = session_id and s.user_id = auth.uid()
  ));
