-- 008: ideas, problems and questions people send with the Feedback button

create table public.feedback (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('idea', 'problem', 'question', 'other')),
  message text not null check (char_length(message) between 5 and 2000),
  email text,                -- optional, so we can reply
  page text,                 -- which page they were on
  user_id uuid references auth.users (id) on delete set null,
  user_agent text,
  emailed boolean not null default false, -- did the copy reach the owner's inbox?
  created_at timestamptz not null default now()
);

create index feedback_recent_idx on public.feedback (created_at desc);

-- Security on, with no policies: only the server (secret key) can read and write it.
alter table public.feedback enable row level security;
