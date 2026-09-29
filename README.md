# ReadyForRound

AI interview practice platform. See [plan.md](plan.md) for the full product plan.

## Folders

- `client/` - frontend (React + Vite + Tailwind). What students see in the browser.
- `server/` - backend (Node.js + Express + TypeScript). Talks to the AI and the database.
- `supabase/migrations/` - SQL files that create our database tables.

## Database changes

From the project root (one-time setup: `npx supabase login` then `npx supabase link --project-ref <your-project-ref>`):

- `npm run db:new <name>` - create a new migration file
- `npm run db:push` - apply new migrations to Supabase
- `npm run db:status` - see which migrations have been applied

## Run locally

You need Node.js and Ollama installed.

1. Download the local AI model (one time):
   ```
   ollama pull llama3.2:3b
   ```
2. Fill in Supabase keys in `server/.env` and `client/.env` (copy from the `.env.example` files).
3. Start the backend (terminal 1):
   ```
   cd server
   npm run dev
   ```
4. Start the frontend (terminal 2):
   ```
   cd client
   npm run dev
   ```
5. Open http://localhost:5180

## Switching AI provider

Edit `server/.env`:

- Local: `LLM_PROVIDER=ollama`
- Online: `LLM_PROVIDER=groq` and set `GROQ_API_KEY` (free key from https://console.groq.com)
