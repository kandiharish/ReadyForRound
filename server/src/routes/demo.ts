import express, { Router } from 'express'
import { rateLimit, ipKeyGenerator } from 'express-rate-limit'
import { z } from 'zod'
import { chat, LlmUnavailableError } from '../llm/client.js'
import { transcribe, SttUnavailableError } from '../stt/transcribe.js'
import { ROLES } from '../catalog.js'
import { getMarket } from '../market.js'
import { logError } from '../errors.js'

// The landing page's "try one question" demo and its live jobs line. No login needed, so it is tightly limited:
// a few tries per visitor per day, a daily cap for everyone together, and only these fixed questions.
export const demoRouter = Router()

// Keep the ids and questions in sync with DEMO_QUESTIONS in client/src/components/HeroDemo.tsx
const QUESTIONS: Record<string, string> = {
  frontend: 'What happens in the browser between typing a website address and seeing the page?',
  data: 'When would you use a LEFT JOIN instead of an INNER JOIN?',
  vlsi: 'What is the difference between setup time and hold time?',
  hr: 'Tell me about a time you worked in a team under pressure.',
  experienced: 'Why are you looking to move on from your current role?',
}

const perVisitor = rateLimit({
  windowMs: 24 * 60 * 60_000,
  limit: 3,
  skipFailedRequests: true, // "we couldn't hear you" doesn't use up a try; the daily cap still counts it
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? ''),
  message: { error: "You've used today's free tries. Sign up free to practise as much as you like." },
  standardHeaders: 'draft-8',
  legacyHeaders: false,
})

// Everyone together: protects the free AI quota if the page gets a lot of visitors
const DAILY_CAP = 300
let capDay = ''
let capUsed = 0
function underDailyCap() {
  const today = new Date().toISOString().slice(0, 10)
  if (today !== capDay) { capDay = today; capUsed = 0 }
  if (capUsed >= DAILY_CAP) return false
  capUsed++
  return true
}

const feedbackSchema = z.object({
  score: z.coerce.number().min(0).max(100),
  good: z.string().trim().min(1).max(160),
  improve: z.string().trim().min(1).max(180),
})

async function grade(question: string, answer: string) {
  const system = `You are an experienced interviewer giving quick, honest feedback on one spoken interview answer.
Reply with JSON only: {"score": 0-100, "good": "...", "improve": "..."}.
- "good": one specific thing the answer did well, at most 12 words. If nothing, say what they attempted.
- "improve": the single most useful next step, at most 14 words.
- Score fairly: off-topic, very short or incorrect answers score below 40; clear, correct answers with an example score 70 or more.
- Talk to the candidate as "you". Do not invent facts about them.`
  const reply = await chat([{ role: 'system', content: system }, { role: 'user', content: `Question: ${question}\n\nAnswer (transcribed speech): """${answer.replaceAll('"""', '"')}"""` }],
    { json: true, temperature: 0.3, maxTokens: 220 })
  const parsed = feedbackSchema.safeParse(JSON.parse(reply.text))
  if (!parsed.success) throw new Error('demo feedback was not in the expected shape')
  return { ...parsed.data, score: Math.round(parsed.data.score) }
}

function questionFrom(req: express.Request) {
  const id = String(req.query.q ?? req.body?.q ?? '')
  return QUESTIONS[id] ? { id, question: QUESTIONS[id] } : null
}

async function answer(req: express.Request, res: express.Response, getText: (question: string) => Promise<string>) {
  const q = questionFrom(req)
  if (!q) return res.status(400).json({ error: 'Unknown question' })
  if (!underDailyCap()) return res.status(429).json({ error: 'The free demo is busy today. Sign up free to practise without waiting.' })
  try {
    const text = (await getText(q.question)).trim()
    if (text.split(/\s+/).filter(Boolean).length < 4) {
      return res.status(422).json({ error: "We couldn't hear much of an answer. Try again and speak for 15 to 30 seconds." })
    }
    res.json({ transcript: text.slice(0, 1200), ...(await grade(q.question, text.slice(0, 2000))) })
  } catch (err) {
    if (err instanceof SttUnavailableError || err instanceof LlmUnavailableError) return res.status(503).json({ error: 'The demo is resting for a moment. Please try again shortly.' })
    logError('server', err as Error, { path: 'demo answer' })
    res.status(502).json({ error: 'Something went wrong scoring that answer. Please try again.' })
  }
}

// Spoken answer: the request body is the recording (up to about 30 seconds)
demoRouter.post('/answer-audio', perVisitor, express.raw({ type: ['audio/*', 'application/octet-stream'], limit: '3mb' }), (req, res) =>
  answer(req, res, async (question) => {
    if (!Buffer.isBuffer(req.body) || req.body.length < 2000) throw new SttUnavailableError('no audio')
    return (await transcribe(req.body, req.headers['content-type'] ?? 'audio/webm', question)).text
  }))

// Typed answer (no microphone, or the visitor prefers typing)
const typedSchema = z.object({ q: z.string(), text: z.string().trim().min(1).max(2000) })
demoRouter.post('/answer-text', perVisitor, (req, res) => {
  const parsed = typedSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Please type an answer first' })
  return answer(req, res, async () => parsed.data.text)
})

// "Live" line under the hero buttons: the roles with the most openings, from the real Jobs Board data
let factCache: { at: number; body: unknown } | null = null
demoRouter.get('/fact', async (_req, res) => {
  try {
    if (!factCache || Date.now() - factCache.at > 10 * 60_000) {
      const market = await getMarket()
      const label = (id: string) => ROLES.find((r) => r.id === id)?.label.replace(/ \(.*\)$/, '') ?? id
      const roles = market.roles
        .filter((r) => (r.total_openings as number) > 0)
        .sort((a, b) => (b.total_openings as number) - (a.total_openings as number))
        .slice(0, 6)
        .map((r) => ({ role: label(r.role_id as string), openings: r.total_openings as number }))
      factCache = { at: Date.now(), body: { roles, updatedAt: market.updatedAt } }
    }
    res.set('Cache-Control', 'public, max-age=600').json(factCache.body)
  } catch {
    res.json({ roles: [], updatedAt: null })
  }
})
