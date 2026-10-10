# Security rules

How ReadyForRound protects students' data, and the rules every change must follow.
If a change breaks one of these, fix it before pushing.

## How it is protected today

| Layer | Protection |
| --- | --- |
| Sign-in | Supabase Auth (email + password, Google). Passwords: 8+ characters. Password reset by one-time email link (`/forgot-password` → `/reset-password`); the reset page never reveals whether an email has an account. |
| API login check | `server/src/auth/requireAuth.ts` verifies the login token's signature and expiry locally with Supabase's public keys (`jose`). Every route except `/api/ping`, `/api/health`, `/api/catalog`, `/api/feedback` and `/api/client-errors` requires it. |
| Ownership | Every read or write of a student's record filters by `user_id` (or checks ownership first). A student can never open another student's interview, report, goal, resume, job ad or group discussion by changing an ID. |
| Database | Row Level Security is on for every table. The browser may only *read* its own rows; it cannot insert, update or delete anything (`018_lock_profile_writes.sql`). All writes go through the server with the secret key. |
| Rate limits | 300 requests a minute per student for normal use; 20 answers a minute; 120 AI-heavy actions an hour; uploads, job ads, project checks, feedback and error reports have their own small limits. Daily plan limits are enforced on the server (`usage.ts`). |
| Headers | Website (`client/vercel.json`): Content Security Policy (only our own scripts), HSTS, no framing, no MIME sniffing, strict referrer, camera/microphone only for this site. API: `helmet` with a deny-all policy (it only returns JSON). |
| AI output | Shown as plain text only (no `dangerouslySetInnerHTML` anywhere). The AI never writes links; learning links are hand-picked and checked (`npm run check-links`). |
| Uploads | Resume: PDF only, 2 MB max; the file is read and discarded, only the text summary is kept. Voice: 15 MB max, transcribed then discarded. |
| Errors | Students see a calm message; details go to the error log, never to the browser. |

## Rules for every change

1. **Secrets live only in `.env` files and the hosting dashboards** (Render, Vercel). Never in code, commits, chat or screenshots. The browser gets only the Supabase URL and publishable key.
2. **Scan before every push** (the repo is public): `git diff --cached` must not contain keys, tokens or passwords.
3. **New private route?** Put it behind `requireAuth`, validate the body with `zod`, and filter every query by `req.user.id`.
4. **New table?** Enable Row Level Security in the same migration. Add read policies only if the browser truly needs them; never add insert/update/delete policies, because the server writes.
5. **New column on `profiles`?** It is server-written only. Never re-add an update policy (that is how `plan` could be changed from the browser).
6. **Calls the AI?** Add the route to `AI_ROUTES` in `server/src/index.ts` (or give it its own limit).
7. **New outside service in the browser** (script, font, API)? Add it to the Content Security Policy in `client/vercel.json`, then test every page with the policy on.
8. **Show AI or user text as text.** No `dangerouslySetInnerHTML`, no links written by the AI.
9. **Test accounts** are created with the admin API and deleted afterwards.
10. **Dependencies:** run `npm audit` in `client/` and `server/` before a release; fix anything high or critical.

## Settings to keep in the Supabase dashboard

These live in the hosted project, not in this repo (`supabase/config.toml` is for local development only):

- Authentication → Providers → Email: **Confirm email** on; **minimum password length 8**; **leaked password protection** on.
- Authentication → URL Configuration: Site URL `https://ready-for-round.vercel.app`; Redirect URLs include `https://ready-for-round.vercel.app/**`.

## Reporting a problem

Found a security issue? Use the Feedback button and choose "Problem", or contact the maintainer privately. Please don't open a public issue with the details.
