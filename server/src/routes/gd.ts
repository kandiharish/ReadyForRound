import express, { Router, type Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../auth/requireAuth.js'
import { logError } from '../errors.js'
import { SttUnavailableError, transcribe } from '../stt/transcribe.js'
import { endGd, GD_CRITERIA, GD_TOPICS, GdError, getGd, listGds, retryGdReport, startGd, takeTurn } from '../gd.js'

// Group discussion practice: /api/gd
export const gdRouter = Router()
gdRouter.use(requireAuth)

const startSchema = z.object({
  topicId: z.enum(GD_TOPICS.map((t) => t.id) as [string, ...string[]]).optional(),
  customTopic: z.string().trim().min(5, 'Please write a slightly longer topic').max(140, 'Please keep the topic under 140 characters').optional(),
  youStart: z.boolean(),
})
const turnSchema = z.union([
  z.object({ text: z.string().trim().min(2, 'Please say something, or pass this turn').max(1500, 'Please keep each point under 1500 characters') }),
  z.object({ pass: z.literal(true) }),
])
const idSchema = z.string().uuid()

function handle(res: Response, err: unknown) {
  if (err instanceof GdError) return res.status(err.status).json({ error: err.message })
  logError('server', err as Error, { path: 'gd' })
  res.status(500).json({ error: 'Something went wrong. Please try again.' })
}

gdRouter.get('/topics', (_req, res) => {
  res.json({ topics: GD_TOPICS, criteria: GD_CRITERIA })
})

gdRouter.get('/', async (req, res) => {
  res.json(await listGds(req.user!.id))
})

gdRouter.post('/', async (req, res) => {
  const parsed = startSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })
  const { topicId, customTopic, youStart } = parsed.data
  const preset = GD_TOPICS.find((t) => t.id === topicId)
  const topic = customTopic ? { title: customTopic, category: 'Your topic' } : preset ?? GD_TOPICS[Math.floor(Math.random() * GD_TOPICS.length)]
  try {
    res.status(201).json(await startGd(req.user!.id, topic, youStart))
  } catch (err) {
    handle(res, err)
  }
})

gdRouter.get('/:id', async (req, res) => {
  if (!idSchema.safeParse(req.params.id).success) return res.status(404).json({ error: 'Group discussion not found' })
  try {
    res.json(await getGd(req.user!.id, req.params.id))
  } catch (err) {
    handle(res, err)
  }
})

gdRouter.post('/:id/turn', async (req, res) => {
  if (!idSchema.safeParse(req.params.id).success) return res.status(404).json({ error: 'Group discussion not found' })
  const parsed = turnSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })
  try {
    res.json(await takeTurn(req.user!.id, req.params.id, parsed.data))
  } catch (err) {
    handle(res, err)
  }
})

// A spoken turn: the body is the recorded audio. It is transcribed, then thrown away.
gdRouter.post('/:id/turn-audio', express.raw({ type: ['audio/*', 'application/octet-stream'], limit: '15mb' }), async (req, res) => {
  if (!idSchema.safeParse(req.params.id).success) return res.status(404).json({ error: 'Group discussion not found' })
  if (!Buffer.isBuffer(req.body) || req.body.length < 1000) return res.status(400).json({ error: "We couldn't hear anything. Please try again." })
  try {
    const gd = await getGd(req.user!.id, req.params.id) // check it's theirs and still going BEFORE using the voice service
    if (gd.status !== 'in_progress') return res.status(409).json({ error: 'This discussion has already finished' })
    const { text, speech } = await transcribe(req.body, req.headers['content-type'] ?? 'audio/webm', `Group discussion on: ${gd.topic}`)
    if (text.length < 2) return res.status(422).json({ error: "We couldn't hear anything. Please try again." })
    res.json(await takeTurn(req.user!.id, req.params.id, { text, speech }))
  } catch (err) {
    if (err instanceof SttUnavailableError) return res.status(503).json({ error: 'Voice is unavailable right now. Please type your point instead.' })
    handle(res, err)
  }
})

gdRouter.post('/:id/end', async (req, res) => {
  if (!idSchema.safeParse(req.params.id).success) return res.status(404).json({ error: 'Group discussion not found' })
  try {
    res.json(await endGd(req.user!.id, req.params.id))
  } catch (err) {
    handle(res, err)
  }
})

gdRouter.post('/:id/report/retry', async (req, res) => {
  if (!idSchema.safeParse(req.params.id).success) return res.status(404).json({ error: 'Group discussion not found' })
  try {
    res.json(await retryGdReport(req.user!.id, req.params.id))
  } catch (err) {
    handle(res, err)
  }
})
