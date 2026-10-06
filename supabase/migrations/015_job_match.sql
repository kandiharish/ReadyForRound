-- 015: Job match. A student pastes a job ad; we keep the text and what was understood from it,
-- so they can practise interviews aimed at that exact job.
create table public.job_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  company text not null default '',
  text text not null,
  summary jsonb not null,   -- experience, must-have / nice-to-have skills, responsibilities, likely interview focus
  skills jsonb not null,    -- skills found in the ad, matched to our skills dictionary: [{ skill, must }]
  created_at timestamptz not null default now()
);
create index job_targets_user_idx on public.job_targets (user_id, created_at desc);
-- Only the server reads and writes this table (with the secret key), so no public policies.
alter table public.job_targets enable row level security;

-- Interviews practised for a specific job ad remember which one.
alter table public.interview_sessions add column job_id uuid references public.job_targets (id) on delete set null;
alter table public.interview_sessions add column job_title text;
