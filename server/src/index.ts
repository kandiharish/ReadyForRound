import express from 'express'
import cors from 'cors'
import { rateLimit, ipKeyGenerator } from 'express-rate-limit'
import { config } from './config.js'
import { isLlmReachable } from './llm/client.js'
import { isDbConnected, supabase } from './db/supabase.js'
import { logError } from './errors.js'
import { profileRouter } from './routes/profile.js'
import { interviewsRouter } from './routes/interviews.js'
import { goalsRouter } from './routes/goals.js'
import { accountRouter } from './routes/account.js'

const app = express()

// Online, the server sits behind the hosting company's proxy. This lets rate limits see each visitor's real address.
app.set('trust proxy', 1)

// Only our own website may call this server. CLIENT_URL can list several addresses, separated by commas.
app.use(cors({ origin: config.CLIENT_URL.split(',').map((u) => u.trim()) }))
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
// Errors from students' browsers (a page crashed, a script failed). Logged in or not.
app.post('/api/client-errors', async (req, res) => {
  const body = req.body ?? {}
  let userId: string | undefined
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null
  if (token && supabase) userId = (await supabase.auth.getUser(token)).data.user?.id
  logError('client', { message: body.message, stack: body.stack }, { path: body.path, userId, userAgent: req.headers['user-agent'] })
  res.status(204).end()
})

// Your data (download / delete): /api/account
app.use('/api/account', accountRouter)
// Goals, Home stats and the Reports list: /api/goals, /api/home, /api/reports
app.use('/api', goalsRouter)

// Catch-all for anything unexpected: log it, and give the student a calm message instead of a crash.
app.use((err: Error & { status?: number }, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // 4xx = the request itself was bad (e.g. broken JSON, too large). That's not our bug, so don't log it.
  if (err.status && err.status < 500) {
    if (!res.headersSent) res.status(err.status).json({ error: 'That request could not be read. Please try again.' })
    return
  }
  logError('server', err, { path: `${req.method} ${req.originalUrl}`, userId: req.user?.id, userAgent: req.headers['user-agent'] })
  if (res.headersSent) return
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' })
})

// Errors outside any request (e.g. a background report) are logged too, instead of silently crashing the server.
process.on('unhandledRejection', (reason) => logError('server', reason instanceof Error ? reason : { message: String(reason) }, { path: 'unhandledRejection' }))
process.on('uncaughtException', (err) => logError('server', err, { path: 'uncaughtException' }))

app.listen(config.PORT, () => {
  console.log(`Server running on http://localhost:${config.PORT} (AI provider: ${config.LLM_PROVIDER})`)
})
