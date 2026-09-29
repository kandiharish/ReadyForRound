# ReadyForRound

AI interview practice platform. See [plan.md](plan.md) for the full product plan.

## Folders

- `client/` - frontend (React + Vite + Tailwind). What students see in the browser.
- `server/` - backend (Node.js + Express + TypeScript). Talks to the AI and (later) the database.

## Run locally

You need Node.js and Ollama installed.

1. Download the local AI model (one time):
   ```
   ollama pull llama3.2:3b
   ```
2. Start the backend (terminal 1):
   ```
   cd server
   copy .env.example .env   # first time only
   npm run dev
   ```
3. Start the frontend (terminal 2):
   ```
   cd client
   npm run dev
   ```
4. Open http://localhost:5180

## Switching AI provider

Edit `server/.env`:

- Local: `LLM_PROVIDER=ollama`
- Online: `LLM_PROVIDER=groq` and set `GROQ_API_KEY` (free key from https://console.groq.com)
