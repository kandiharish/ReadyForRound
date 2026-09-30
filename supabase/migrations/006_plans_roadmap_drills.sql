-- 006: plans (for usage limits), weekly study time on goals, roadmap tasks, and daily drills

-- Every student starts on the free plan. A future "pro" plan gets higher limits.
alter table public.profiles add column plan text not null default 'free' check (plan in ('free', 'pro'));

-- How many hours a week the student can give to this goal (sizes their roadmap).
alter table public.goals add column weekly_hours smallint not null default 5 check (weekly_hours between 1 and 40);

-- Drills: short 5-minute practice sessions on one topic.
alter table public.interview_sessions drop constraint interview_sessions_mode_check;
alter table public.interview_sessions add constraint interview_sessions_mode_check check (mode in ('single', 'complete', 'drill'));
alter table public.interview_sessions add column focus_topic text;

-- The personal roadmap: tasks grouped by week, for one goal.
create table public.roadmap_tasks (
  id bigint generated always as identity primary key,
  goal_id uuid not null references public.goals (id) on delete cascade,
  week smallint not null check (week between 1 and 52),
  position smallint not null default 0,
  kind text not null check (kind in ('learn', 'practice', 'build', 'mock')),
  title text not null,
  detail text not null default '',
  topic text,
  minutes smallint not null default 30,
  why text not null default '',            -- the gap this task fixes, so the plan never feels random
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

create index roadmap_tasks_goal_idx on public.roadmap_tasks (goal_id, week, position);

alter table public.roadmap_tasks enable row level security;
create policy "Users can read their own roadmap"
  on public.roadmap_tasks for select
  using (exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid()));
