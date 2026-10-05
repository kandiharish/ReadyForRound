-- 012: Career Compass results, and whether the person felt the result fitted (to improve the scoring later)
create table public.career_assessments (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  answers jsonb not null,
  result jsonb not null,
  fit text check (fit in ('yes', 'partly', 'no')),
  fit_note text check (char_length(fit_note) <= 500),
  created_at timestamptz not null default now()
);
create index career_assessments_user_idx on public.career_assessments (user_id, created_at desc);

-- Security on, with no policies: only the server (secret key) reads and writes it.
alter table public.career_assessments enable row level security;
