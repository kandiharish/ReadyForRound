-- 005: goals (what the student is preparing for) + experience levels for working professionals

-- More experience levels, so the app keeps working as students start their careers.
update public.profiles set experience_level = 'working_1_2' where experience_level = 'working';
alter table public.profiles drop constraint profiles_experience_level_check;
alter table public.profiles add constraint profiles_experience_level_check check (experience_level in
  ('2nd_year', '3rd_year', 'final_year', 'graduate', 'working_1_2', 'working_3_5', 'working_5_plus'));

-- One row per goal. A person has many goals over the years; at most one is active at a time.
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  target_role text not null check (target_role in ('frontend', 'backend', 'fullstack', 'data_analyst')),
  company_type text not null check (company_type in ('service', 'product', 'startup', 'any')),
  experience_level text not null check (experience_level in
    ('2nd_year', '3rd_year', 'final_year', 'graduate', 'working_1_2', 'working_3_5', 'working_5_plus')),
  target_date date,
  status text not null default 'active' check (status in ('active', 'achieved', 'archived')),
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

-- The database itself guarantees only one active goal per person.
create unique index goals_one_active_per_user on public.goals (user_id) where status = 'active';
create index goals_user_idx on public.goals (user_id, created_at desc);

alter table public.goals enable row level security;
create policy "Users can read their own goals"
  on public.goals for select
  using (auth.uid() = user_id);

-- Each interview remembers which goal it was for.
alter table public.interview_sessions add column goal_id uuid references public.goals (id) on delete set null;
create index interview_sessions_goal_idx on public.interview_sessions (goal_id, created_at desc);

-- Existing students: turn their onboarding answers into a first goal, and link their interviews to it.
insert into public.goals (user_id, target_role, company_type, experience_level, target_date)
select id, target_role, coalesce(target_company_type, 'any'), experience_level,
  case placement_timeline
    when 'lt_1_month' then (now() + interval '3 weeks')::date
    when '1_3_months' then (now() + interval '8 weeks')::date
    when '3_plus_months' then (now() + interval '16 weeks')::date
  end
from public.profiles
where onboarding_completed and target_role is not null and experience_level is not null;

update public.interview_sessions s
set goal_id = g.id
from public.goals g
where g.user_id = s.user_id and s.goal_id is null;
