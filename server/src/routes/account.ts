import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../db/supabase.js'
import { requireAuth } from '../auth/requireAuth.js'

// The student's own data: download a copy, or delete everything (privacy rights).
export const accountRouter = Router()
accountRouter.use(requireAuth)

// Everything we store about this student, as one JSON file.
accountRouter.get('/export', async (req, res) => {
  const id = req.user!.id
  const db = supabase!
  const [profile, skills, goals, sessions, feedback] = await Promise.all([
    db.from('profiles').select('full_name, role, experience_level, speaking_pace, practice_without_score, plan, created_at').eq('id', id).single(),
    db.from('user_skills').select('skill, self_rating, proven_score').eq('user_id', id),
    db.from('goals').select('id, target_role, company_type, experience_level, target_date, weekly_hours, status, created_at, finished_at, roadmap_tasks (week, kind, title, done)').eq('user_id', id),
    db.from('interview_sessions')
      .select('id, goal_id, mode, rounds, focus_topic, status, created_at, completed_at, interview_turns (seq, round, question, answer, skipped), interview_reports (report)')
      .eq('user_id', id)
      .order('created_at'),
    db.from('feedback').select('kind, message, email, page, created_at').eq('user_id', id).order('created_at'),
  ])

  res.setHeader('Content-Disposition', 'attachment; filename="readyforround-my-data.json"')
  res.json({
    exportedAt: new Date().toISOString(),
    account: { email: req.user!.email, ...profile.data },
    skills: skills.data ?? [],
    goals: goals.data ?? [],
    interviews: sessions.data ?? [],
    feedback: feedback.data ?? [],
    note: 'Video is never recorded and voice recordings are not stored, so they are not included.',
  })
})

// Delete the account and everything linked to it. The student must type DELETE to confirm.
accountRouter.delete('/', async (req, res) => {
  if (!z.object({ confirm: z.literal('DELETE') }).safeParse(req.body).success) {
    return res.status(400).json({ error: 'Type DELETE to confirm' })
  }
  // Feedback is kept anonymously by default ("on delete set null"), but someone deleting their account wants it gone too.
  await supabase!.from('feedback').delete().eq('user_id', req.user!.id)
  // Deleting the login removes the profile, goals, interviews, reports and roadmap too ("on delete cascade").
  const { error } = await supabase!.auth.admin.deleteUser(req.user!.id)
  if (error) return res.status(500).json({ error: 'Could not delete the account. Please try again.' })
  res.json({ ok: true })
})
