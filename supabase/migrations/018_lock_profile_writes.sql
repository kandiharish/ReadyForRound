-- Security fix: students could change their own profile row straight from the browser
-- (with their login token and the public key), including the "plan" column, which would lift
-- their daily limits. Every write already goes through our server with the secret key,
-- so signed-in users don't need to write this table directly at all.

drop policy if exists "Users can update their own profile" on public.profiles;

-- Belt and braces: even if a policy is added by mistake later, the browser roles can't write here.
revoke insert, update, delete on public.profiles from anon, authenticated;
