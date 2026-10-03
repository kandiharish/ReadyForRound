import express, { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { requireAuth } from '../auth/requireAuth.js'
import { deleteResume, getResume, ResumeError, saveResume } from '../resume.js'

// The student's resume: upload a PDF, see what we understood from it, or remove it.
export const resumeRouter = Router()
resumeRouter.use(requireAuth)

// Reading a resume uses the AI, so keep uploads to a few per hour per person.
const uploadLimit = rateLimit({
  windowMs: 60 * 60_000,
  limit: 5,
  keyGenerator: (req) => req.user!.id,
  message: { error: "You've uploaded a few times already. Please try again in an hour." },
  standardHeaders: 'draft-8',
  legacyHeaders: false,
})

resumeRouter.get('/', async (req, res) => {
  res.json(await getResume(req.user!.id))
})

// The PDF arrives as raw bytes (not JSON). Max 2 MB.
resumeRouter.post('/', uploadLimit, express.raw({ type: 'application/pdf', limit: '2mb' }), async (req, res, next) => {
  try {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) return res.status(400).json({ error: 'Please choose a PDF file to upload.' })
    const fileName = decodeURIComponent(String(req.headers['x-file-name'] ?? 'resume.pdf'))
    res.json(await saveResume(req.user!.id, fileName, new Uint8Array(req.body)))
  } catch (err) {
    if (err instanceof ResumeError) return res.status(err.status).json({ error: err.message })
    next(err)
  }
})

resumeRouter.delete('/', async (req, res) => {
  await deleteResume(req.user!.id)
  res.status(204).end()
})
