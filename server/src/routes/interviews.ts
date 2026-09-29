import { Router, type Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../auth/requireAuth.js'
import { roundIds } from '../interview/rounds.js'
import { InterviewError, answerQuestion, endInterview, getInterview, listInterviews, startInterview } from '../interview/engine.js'

export const interviewsRouter = Router()
interviewsRouter.use(requireAuth) // every interview route needs a logged-in student

const startSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('complete') }),
  z.object({ mode: z.literal('single'), round: z.enum(roundIds) }),
])

const answerSchema = z.object({
  answer: z.string().trim().max(3000, 'Answer is too long (max 3000 characters)').optional(),
  skip: z.boolean().optional(),
})

const idSchema = z.string().uuid()

function handleError(res: Response, err: unknown) {
  if (err instanceof InterviewError) return res.status(err.status).json({ error: err.message })
  console.error(err)
  res.status(500).json({ error: 'Something went wrong' })
}

// List my interviews (newest first).
interviewsRouter.get('/', async (req, res) => {
  res.json(await listInterviews(req.user!.id))
})

// Start a new interview: { mode: "complete" } or { mode: "single", round: "technical" }
interviewsRouter.post('/', async (req, res) => {
  const parsed = startSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })
  try {
    const body = parsed.data
    res.status(201).json(await startInterview(req.user!.id, body.mode, body.mode === 'single' ? body.round : undefined))
  } catch (err) {
    handleError(res, err)
  }
})

// Open one interview (e.g. after a page refresh).
interviewsRouter.get('/:id', async (req, res) => {
  if (!idSchema.safeParse(req.params.id).success) return res.status(404).json({ error: 'Interview not found' })
  try {
    res.json(await getInterview(req.user!.id, req.params.id))
  } catch (err) {
    handleError(res, err)
  }
})

// Answer the current question: { answer: "..." } or { skip: true }
interviewsRouter.post('/:id/answer', async (req, res) => {
  if (!idSchema.safeParse(req.params.id).success) return res.status(404).json({ error: 'Interview not found' })
  const parsed = answerSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })

  const { answer, skip } = parsed.data
  if (!skip && !answer) return res.status(400).json({ error: 'Please type an answer, or skip the question' })
  try {
    res.json(await answerQuestion(req.user!.id, req.params.id, skip ? null : answer!))
  } catch (err) {
    handleError(res, err)
  }
})

// Stop the interview early.
interviewsRouter.post('/:id/end', async (req, res) => {
  if (!idSchema.safeParse(req.params.id).success) return res.status(404).json({ error: 'Interview not found' })
  try {
    res.json(await endInterview(req.user!.id, req.params.id))
  } catch (err) {
    handleError(res, err)
  }
})
