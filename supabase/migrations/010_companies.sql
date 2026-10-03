-- 010: company-style interviews and company practice question banks

-- Which company an interview was modelled on (null = a general interview).
-- Company ids come from the server catalog (server/src/companies.ts).
alter table public.interview_sessions add column company_id text;

-- Practice questions per company and role. Generated once by the AI, then shared by everyone
-- (fast, and saves the free AI quota).
create table public.company_questions (
  company_id text not null,
  role_id text not null,
  questions jsonb not null,        -- [{ round, question, topic, tip, answer }]
  generated_with text,
  created_at timestamptz not null default now(),
  primary key (company_id, role_id)
);

-- Security on, with no policies: only the server (secret key) reads and writes it.
alter table public.company_questions enable row level security;
