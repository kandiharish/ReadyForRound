-- 017: Resume Studio. The page count (for the one-page check) and a cache of the AI "project fit" review,
-- so the same resume and role aren't sent to the AI twice.
alter table public.resumes add column pages int;
alter table public.resumes add column project_fit jsonb;  -- { key: "<role>:<resume updated_at>", result: {...} }
