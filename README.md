# ReadyForRound

**Prepare. Practice. Progress.** A 100% free AI mock-interview app. You talk to an AI interviewer by voice
(or type), get an honest feedback report in minutes, and a study plan built from your gaps.

Live: https://ready-for-round.vercel.app

## What it does

- Voice interviews with an AI interviewer (Priya or Arjun) who speaks each question and asks follow-ups
- Technical, Project deep-dive, Behavioural and HR rounds, or a complete interview drive
- Feedback reports: overall score, strengths, gaps, a strong example answer and what to study next
- Skills "claimed vs proven", a weekly study roadmap, 5-minute drills, streaks and progress
- Goals that grow with your career, interview guides, in-app notifications, light and dark themes
- Privacy first: video is never recorded; download or delete all your data any time
- Feedback button: ideas and problems are saved and emailed to the team

## Folders

```
client/                 Website (React + Vite + Tailwind). Deployed on Vercel.
  public/               Images, icons, robots.txt and sitemap.xml
  src/pages/            One file per screen (Landing, Home, InterviewRoom, ReportPage, ...)
  src/components/       Shared pieces (buttons, dropdowns, avatar, feedback form, ...)
  src/lib/              Helpers (API calls, skills dictionary, Supabase client, ...)
server/                 Backend API (Node.js + Express + TypeScript). Deployed on Render.
  src/routes/           API endpoints
  src/interview/        Interview engine and prompts
  src/report/           Report grading and prompts
  src/llm/ , src/stt/   AI chat (Groq / Ollama / OpenRouter) and speech-to-text
supabase/migrations/    SQL files that create the database tables
docs/                   Product plan and the step-by-step deployment guide
render.yaml             Render settings for the backend
```

## Run locally

You need Node.js 22 and, for offline AI, [Ollama](https://ollama.com).

1. Copy `server/.env.example` to `server/.env` and `client/.env.example` to `client/.env`, then fill in your keys.
   Never commit `.env` files.
2. Start the backend (terminal 1):
   ```
   cd server
   npm install
   npm run dev
   ```
3. Start the website (terminal 2):
   ```
   cd client
   npm install
   npm run dev
   ```
4. Open http://localhost:5180

### AI provider

In `server/.env`: `LLM_PROVIDER=ollama` (local, needs Ollama running) or `LLM_PROVIDER=groq`
with a free `GROQ_API_KEY` from https://console.groq.com. Voice answers always use Groq's speech-to-text.

## Database changes

From the project root (one-time setup: `npx supabase login`, then `npx supabase link --project-ref <your-project-ref>`):

- `npm run db:new <name>`: create a new migration file
- `npm run db:push`: apply new migrations to Supabase
- `npm run db:status`: see which migrations are applied

## Deploying

See [docs/DEPLOY.md](docs/DEPLOY.md). After the first setup, pushing to `main` redeploys Vercel and Render automatically.
The product plan is in [docs/plan.md](docs/plan.md).
