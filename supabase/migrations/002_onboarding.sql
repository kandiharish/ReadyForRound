-- 002: onboarding details + skills
-- Adds what the interview engine needs to personalise questions.

-- Clear any free-text values from before, so the new allowed-value checks can apply.
update public.profiles set target_role = null, experience_level = null;

alter table public.profiles
  add constraint profiles_target_role_check
    check (target_role in ('frontend', 'backend', 'fullstack', 'data_analyst')),
  add constraint profiles_experience_level_check
    check (experience_level in ('2nd_year', '3rd_year', 'final_year', 'graduate', 'working')),
  add column target_company_type text
    check (target_company_type in ('service', 'product', 'startup', 'any')),
  add column placement_timeline text
    check (placement_timeline in ('lt_1_month', '1_3_months', '3_plus_months', 'not_sure')),
  add column speaking_pace text not null default 'normal'
    check (speaking_pace in ('slow', 'normal')),
  add column practice_without_score boolean not null default false,
  add column onboarding_completed boolean not null default false;

-- One row per skill per student. Linked to profiles by user_id.
create table public.user_skills (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  skill text not null,
  self_rating smallint not null check (self_rating between 1 and 5), -- what the student claims
  proven_score smallint check (proven_score between 0 and 100),     -- what interviews show (filled later)
  created_at timestamptz not null default now(),
  unique (user_id, skill) -- a student can't list the same skill twice
);

alter table public.user_skills enable row level security;

create policy "Users can read their own skills"
  on public.user_skills for select
  using (auth.uid() = user_id);
