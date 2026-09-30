import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../db/supabase.js'
import { requireAuth } from '../auth/requireAuth.js'
import { companyTypeIds, experienceIds, roleIds } from '../catalog.js'
import { createGoal } from '../goals.js'
import { goalsWithStats, homeStats, listSessions } from '../stats.js'
import { getUsage } from '../usage.js'
import { generateRoadmap, getRoadmap, setTaskDone } from '../roadmap.js'

export const goalsRouter = Router()
goalsRouter.use(requireAuth)

// Everything the Home page needs in one request.
goalsRouter.get('/home', async (req, res) => {
  res.json(await homeStats(req.user!.id))
})

// Today's usage and limits (shown in the sidebar and on the Practice page).
goalsRouter.get('/usage', async (req, res) => {
  res.json(await getUsage(req.user!.id))
})

// The roadmap for the current goal.
goalsRouter.get('/roadmap', async (req, res) => {
  res.json(await getRoadmap(req.user!.id))
})

// Build (or rebuild) the roadmap from the latest feedback. Finished tasks are kept.
goalsRouter.post('/roadmap/generate', async (req, res) => {
  try {
    res.json(await generateRoadmap(req.user!.id))
  } catch (err) {
    res.status(503).json({ error: (err as Error).message })
  }
})

// Tick a task off (or un-tick it).
goalsRouter.patch('/roadmap/tasks/:id', async (req, res) => {
  const parsed = z.object({ done: z.boolean() }).safeParse(req.body)
  const id = Number(req.params.id)
  if (!parsed.success || !Number.isInteger(id)) return res.status(400).json({ error: 'Invalid request' })
  if (!(await setTaskDone(req.user!.id, id, parsed.data.done))) return res.status(404).json({ error: 'Task not found' })
  res.json({ ok: true })
})

// All finished interviews, for the Reports page.
goalsRouter.get('/reports', async (req, res) => {
  const sessions = await listSessions(req.user!.id)
  res.json(sessions.filter((s) => s.status !== 'in_progress').map(({ questions, ...s }) => s))
})

goalsRouter.get('/goals', async (req, res) => {
  res.json(await goalsWithStats(req.user!.id))
})

const goalSchema = z.object({
  target_role: z.enum(roleIds),
  company_type: z.enum(companyTypeIds),
  experience_level: z.enum(experienceIds),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  weekly_hours: z.number().int().min(1).max(40).default(5),
})

// Start a new goal. It becomes the active one; the previous active goal is paused.
goalsRouter.post('/goals', async (req, res) => {
  const parsed = goalSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })
  try {
    // Keep the profile's experience up to date with the newest goal.
    await supabase!.from('profiles').update({ experience_level: parsed.data.experience_level }).eq('id', req.user!.id)
    res.status(201).json(await createGoal(req.user!.id, parsed.data))
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

const updateSchema = z.object({ status: z.enum(['active', 'achieved', 'archived']) })

// Mark a goal achieved, pause it, or switch back to it.
goalsRouter.patch('/goals/:id', async (req, res) => {
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success || !z.string().uuid().safeParse(req.params.id).success) {
    return res.status(400).json({ error: 'Invalid request' })
  }
  const userId = req.user!.id
  const { status } = parsed.data

  if (status === 'active') {
    // Only one active goal: pause the current one first.
    await supabase!.from('goals').update({ status: 'archived', finished_at: new Date().toISOString() })
      .eq('user_id', userId).eq('status', 'active').neq('id', req.params.id)
  }
  const { data, error } = await supabase!
    .from('goals')
    .update({ status, finished_at: status === 'active' ? null : new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('user_id', userId) // a student can only change their own goals
    .select('id')
  if (error) return res.status(500).json({ error: error.message })
  if (!data?.length) return res.status(404).json({ error: 'Goal not found' })
  res.json({ ok: true })
})
