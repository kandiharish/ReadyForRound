import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../auth/requireAuth.js'
import { supabase } from '../db/supabase.js'

// Career Compass: the scoring runs in the browser (plain rules); the server keeps each result
// and the person's "does this fit you?" feedback, so the scoring can be improved with real data.
export const compassRouter = Router()
compassRouter.use(requireAuth)

const saveSchema = z.object({
  answers: z.record(z.string(), z.unknown()),
  result: z.object({ version: z.number(), matches: z.array(z.object({ role: z.string(), percent: z.number() }).passthrough()).min(1) }).passthrough(),
})
const fitSchema = z.object({ fit: z.enum(['yes', 'partly', 'no']), note: z.string().trim().max(500).optional() })

// The latest result
compassRouter.get('/', async (req, res) => {
  const { data } = await supabase!.from('career_assessments').select('id, result, fit, created_at')
    .eq('user_id', req.user!.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
  res.json(data ?? null)
})

compassRouter.post('/', async (req, res) => {
  const parsed = saveSchema.safeParse(req.body)
  if (!parsed.success || JSON.stringify(req.body).length > 20_000) return res.status(400).json({ error: 'Could not save your result.' })
  const { data, error } = await supabase!.from('career_assessments')
    .insert({ user_id: req.user!.id, answers: parsed.data.answers, result: parsed.data.result }).select('id, result, fit, created_at').single()
  if (error) return res.status(500).json({ error: 'Could not save your result.' })
  res.status(201).json(data)
})

compassRouter.post('/:id/fit', async (req, res) => {
  const parsed = fitSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Please choose an option.' })
  await supabase!.from('career_assessments').update({ fit: parsed.data.fit, fit_note: parsed.data.note ?? null })
    .eq('id', Number(req.params.id)).eq('user_id', req.user!.id)
  res.status(204).end()
})
