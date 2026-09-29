import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import { chat, isLlmReachable } from './llm/client.js'
import { isDbConnected } from './db/supabase.js'
import { requireAuth } from './auth/requireAuth.js'
import { profileRouter } from './routes/profile.js'

const app = express()

app.use(cors({ origin: config.CLIENT_URL })) // only our frontend may call this server
app.use(express.json()) // lets us read JSON sent by the frontend

// "Are you alive?" check used by the frontend.
app.get('/api/health', async (_req, res) => {
  res.json({
    status: 'ok',
    llmProvider: config.LLM_PROVIDER,
    llmReachable: await isLlmReachable(),
    dbConnected: await isDbConnected(),
  })
})

// Profile routes: /api/catalog, /api/me, /api/onboarding
app.use('/api', profileRouter)

// Temporary test route: send a message, get the AI's reply.
// Logged-in users only, so strangers can't use up our AI quota.
app.post('/api/llm/test', requireAuth, async (req, res) => {
  const message = typeof req.body?.message === 'string' ? req.body.message : 'Say hello in one sentence.'
  try {
    const reply = await chat([
      { role: 'system', content: 'You are a friendly job interviewer. Keep replies short.' },
      { role: 'user', content: message },
    ])
    res.json(reply)
  } catch (err) {
    res.status(502).json({ error: (err as Error).message })
  }
})

app.listen(config.PORT, () => {
  console.log(`Server running on http://localhost:${config.PORT} (AI provider: ${config.LLM_PROVIDER})`)
})
