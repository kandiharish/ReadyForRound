-- 004: feedback reports, one per interview

create table public.interview_reports (
  session_id uuid primary key references public.interview_sessions (id) on delete cascade,
  status text not null default 'generating' check (status in ('generating', 'ready', 'failed')),
  report jsonb,          -- the finished report (scores, feedback per question, summary)
  error text,            -- why generation failed, for debugging
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.interview_reports enable row level security;

create policy "Users can read reports of their own interviews"
  on public.interview_reports for select
  using (exists (
    select 1 from public.interview_sessions s
    where s.id = session_id and s.user_id = auth.uid()
  ));
