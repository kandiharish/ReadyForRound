import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { z } from 'zod'
import { requireAuth } from '../auth/requireAuth.js'
import { addJob, deleteJob, getJob, JobError, listJobs } from '../jobs.js'

// Job match: paste a job ad, see how you match, and practise for it.
export const jobsRouter = Router()
jobsRouter.use(requireAuth)

// Reading a job ad uses the AI, so keep it to a handful per hour per person.
const addLimit = rateLimit({
  windowMs: 60 * 60_000,
  limit: 8,
  keyGenerator: (req) => req.user!.id,
  message: { error: "You've added several job ads already. Please try again in an hour." },
  standardHeaders: 'draft-8',
  legacyHeaders: false,
})

const addSchema = z.object({ text: z.string().trim().min(1, 'Please paste a job description').max(20_000, 'That job description is too long') })
const idSchema = z.string().uuid()

jobsRouter.get('/', async (req, res) => {
  res.json(await listJobs(req.user!.id))
})

jobsRouter.post('/', addLimit, async (req, res, next) => {
  const parsed = addSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })
  try {
    res.status(201).json(await addJob(req.user!.id, parsed.data.text))
  } catch (err) {
    if (err instanceof JobError) return res.status(err.status).json({ error: err.message })
    next(err)
  }
})

jobsRouter.get('/:id', async (req, res, next) => {
  if (!idSchema.safeParse(req.params.id).success) return res.status(404).json({ error: 'Job ad not found' })
  try {
    res.json(await getJob(req.user!.id, req.params.id))
  } catch (err) {
    if (err instanceof JobError) return res.status(err.status).json({ error: err.message })
    next(err)
  }
})

jobsRouter.delete('/:id', async (req, res) => {
  if (!idSchema.safeParse(req.params.id).success) return res.status(404).json({ error: 'Job ad not found' })
  await deleteJob(req.user!.id, req.params.id)
  res.status(204).end()
})
