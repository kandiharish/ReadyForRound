-- 009: more roles, and resume-based interviews

-- Roles: the server's catalog (server/src/catalog.ts) is the single source of truth and already rejects
-- unknown roles, so the database no longer hard-codes the list. New roles then need no migration.
alter table public.profiles drop constraint if exists profiles_target_role_check;
alter table public.goals drop constraint if exists goals_target_role_check;

-- Resumes: we keep the extracted TEXT and an AI summary, never the uploaded file itself.
create table public.resumes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  file_name text not null,
  text text not null check (char_length(text) <= 20000),
  summary jsonb not null,          -- { headline, skills[], projects[], experience[], education }
  updated_at timestamptz not null default now()
);

-- Security on, with no policies: only the server (secret key) can read and write it.
alter table public.resumes enable row level security;
