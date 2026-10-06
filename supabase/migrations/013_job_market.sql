-- 013: daily job market snapshots per role (from Adzuna job ads in India)
create table public.market_snapshots (
  id bigint generated always as identity primary key,
  role_id text not null,
  fetched_on date not null,
  fetched_at timestamptz not null default now(),
  total_openings integer not null,     -- matching ads in the last 30 days
  sample_size integer not null,        -- ads we read to work out the details below
  salary jsonb,                        -- { p25, p50, p75, count } yearly INR, only from ads that state a salary
  fresher_share real,                  -- 0..1 of sampled ads open to freshers
  cities jsonb not null default '[]',
  companies jsonb not null default '[]',
  skills jsonb not null default '[]',  -- [{ skill, share }]
  unique (role_id, fetched_on)
);
create index market_snapshots_recent_idx on public.market_snapshots (fetched_on desc);

-- Security on, with no policies: only the server reads and writes it.
alter table public.market_snapshots enable row level security;
