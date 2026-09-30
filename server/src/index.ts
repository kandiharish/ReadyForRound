import express from 'express'
import cors from 'cors'
import { rateLimit, ipKeyGenerator } from 'express-rate-limit'
import { config } from './config.js'
import { chat, isLlmReachable } from './llm/client.js'
import { isDbConnected } from './db/supabase.js'
import { requireAuth } from './auth/requireAuth.js'
import { profileRouter } from './routes/profile.js'
import { interviewsRouter } from './routes/interviews.js'
import { goalsRouter } from './routes/goals.js'

const app = express()

app.use(cors({ origin: config.CLIENT_URL })) // only our frontend may call this server
app.use(express.json()) // lets us read JSON sent by the frontend

// Rate limits: stop scripts or bots from hammering the server. Counted per logged-in user
// (their login token), or per network address for requests without one.
const perUser = (req: express.Request) => req.headers.authorization?.slice(-32) ?? ipKeyGenerator(req.ip ?? '')
const tooMany = { error: 'Too many requests. Please slow down and try again in a minute.' }
app.use('/api', rateLimit({ windowMs: 60_000, limit: 120, keyGenerator: perUser, message: tooMany, standardHeaders: 'draft-8', legacyHeaders: false }))
// Answers call the AI, so they get a tighter limit.
app.use(/^\/api\/interviews\/[^/]+\/answer/, rateLimit({ windowMs: 60_000, limit: 20, keyGenerator: perUser, message: tooMany, standardHeaders: 'draft-8', legacyHeaders: false }))

// "Are you alive?" check used by the frontend.
app.get('/api/health', async (_req, res) => {
  res.json({
    status: 'ok',
    llmProvider: config.LLM_PROVIDER,
    llmReachable: await isLlmReachable(),
    dbConnected: await isDbConnected(),
    voiceAnswersReady: !!config.GROQ_API_KEY, // speech-to-text needs a Groq key
  })
})

// Profile routes: /api/catalog, /api/me, /api/onboarding
app.use('/api', profileRouter)
// Interview routes: /api/interviews/...
app.use('/api/interviews', interviewsRouter)
// Goals, Home stats and the Reports list: /api/goals, /api/home, /api/reports
app.use('/api', goalsRouter)

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
