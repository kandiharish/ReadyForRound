-- 001: profiles table
-- Supabase already keeps login details (email, scrambled password) in auth.users.
-- This table holds the extra information we need about each person.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'student' check (role in ('student', 'recruiter', 'admin')),
  target_role text,          -- e.g. 'Frontend Developer'
  experience_level text,     -- e.g. 'fresher', '1-2 years'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row Level Security: nobody can read or change rows unless a policy below allows it.
alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users may edit their own profile, but not change their own role.
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

-- Automatically create an empty profile whenever someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
