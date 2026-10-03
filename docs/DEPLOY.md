# Putting ReadyForRound online

The code is ready. These steps need **your** accounts, so they're done by hand once.
Do them in order. Never paste a secret key into chat or into code: only into the hosting dashboards.

```
Students' browsers ──▶ Vercel (website, client/) ──▶ Render (server, server/) ──▶ Supabase (database + login)
                                                                  └──────────▶ Groq (AI questions, grading, speech-to-text)
```

## 1. Put the code on GitHub
Vercel and Render deploy straight from a GitHub repository.
1. Create a **private** repository on github.com (e.g. `readyforround`).
2. Push this folder to it. Before the first push, check no secrets are included:
   `git status` must NOT list any `.env` file (they're in `.gitignore`).

## 2. Fresh secret keys (the old ones were shared in chat)
| Service | Where | What to do |
|---|---|---|
| Supabase | Project Settings → API Keys | Create a new **secret** key, use it in step 3, then delete the old one |
| Groq | console.groq.com → API Keys | Create a new key, use it in step 3, then delete the old one |
| Google sign-in | Google Cloud → Clients → your client | **Add secret**, paste it in Supabase → Authentication → Sign In / Providers → Google, then disable the old secret |

Update your laptop's `server/.env` with the new Supabase and Groq keys too.

## 3. Backend on Render (free)
1. render.com → sign up with GitHub → **New → Blueprint** → pick your repository.
   Render reads `render.yaml` and creates the `readyforround-api` service.
2. When asked, fill in:
   - `SUPABASE_URL`: your Supabase project URL
   - `SUPABASE_SECRET_KEY`: the **new** secret key from step 2
   - `GROQ_API_KEY`: the **new** Groq key from step 2
   - `CLIENT_URL`: leave as `https://example.com` for now (fixed in step 5)
   - `RESEND_API_KEY` and `FEEDBACK_TO_EMAIL`: for the Feedback button (step 6b). Optional: without them,
     feedback is still saved in the `feedback` table, just not emailed.
3. Wait for "Live", then open `https://<your-service>.onrender.com/api/health`.
   You should see `"status":"ok"` and `"dbConnected":true`.

Free Render servers sleep after ~15 minutes without visitors; the first request after that takes ~30-60 seconds.

## 4. Website on Vercel (free)
1. vercel.com → sign up with GitHub → **Add New → Project** → pick your repository.
2. **Root Directory:** `client` (Vercel then finds `vercel.json`).
3. Environment variables:
   - `VITE_SUPABASE_URL`: your Supabase project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: your publishable key
   - `VITE_API_URL`: your Render address, e.g. `https://readyforround-api.onrender.com`
   - `VITE_CONTACT_EMAIL`: the email students can write to about their data
4. **Deploy**. Note your address, e.g. `https://readyforround.vercel.app`.

## 5. Connect everything
1. Render → your service → Environment → set `CLIENT_URL` to your Vercel address → Save (it redeploys).
2. Supabase → Authentication → **URL Configuration**:
   - Site URL: your Vercel address
   - Redirect URLs: add `https://<your-vercel-address>/**` (keep the localhost one for development)
3. Google Cloud → your OAuth client → **Authorized JavaScript origins**: add your Vercel address.

## 6. Email for sign-ups
Supabase's built-in email sends only a few emails per hour: fine for testing, not for a class of students.
Pick one:
- **Brevo (free, no domain needed):** brevo.com → verify your sender email → SMTP & API → create an SMTP key.
  Supabase → Authentication → Emails → **SMTP Settings** → enable custom SMTP:
  host `smtp-relay.brevo.com`, port `587`, user = your Brevo login, password = the SMTP key, sender = your verified email.
- **Resend:** needs your own domain (e.g. `readyforround.in`), but gives the most professional emails.
- **Simplest for a first pilot:** ask students to use **Continue with Google**, which needs no confirmation emails at all.

## 6b. Feedback emails
1. resend.com → sign up **with the email you want feedback sent to** (free: 3,000 emails/month).
2. **API Keys → Create API Key** → copy it (starts with `re_`).
3. Render → Environment: `RESEND_API_KEY` = the key, `FEEDBACK_TO_EMAIL` = your email → Save.
   Without your own domain, Resend can only send to your own account's email, which is exactly what we need.

## 6c. Google search
1. search.google.com/search-console → **Add property → URL prefix** → your Vercel address.
2. Choose **HTML tag**, put the `google-site-verification` meta tag in `client/index.html`, push, wait for Vercel, then **Verify**.
3. **Sitemaps** → submit `sitemap.xml`. Then **URL inspection** → your address → **Request indexing**.
4. If your address changes (e.g. your own domain), update it in `client/index.html`, `client/public/robots.txt` and `client/public/sitemap.xml`.

## 7. Final checks
- [ ] Sign up with a new email (or Google) on the live site → onboarding → Home
- [ ] Do a short interview by voice and get a report
- [ ] Toggle light/dark, open Privacy and Terms
- [ ] Send a message with the Feedback button and check it arrives in your inbox
- [ ] Supabase → Table Editor → `app_errors` and `feedback`: check them now and then

## Updating later
Push to GitHub: Vercel and Render redeploy automatically. Database changes still go through `npm run db:push` from your laptop.
