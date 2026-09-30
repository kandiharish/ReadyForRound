import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../db/supabase.js'
import { requireAuth } from '../auth/requireAuth.js'
import { catalog, companyTypeIds, experienceIds, roleIds, timelineIds, timelineToTargetDate } from '../catalog.js'
import { createGoal, getActiveGoal } from '../goals.js'

export const profileRouter = Router()

// The lists for the onboarding screens (roles, skills, company types...). Public: no secrets here.
profileRouter.get('/catalog', (_req, res) => {
  res.json(catalog)
})

// "Who am I?" - profile plus skills for the logged-in user.
profileRouter.get('/me', requireAuth, async (req, res) => {
  const { data, error } = await supabase!
    .from('profiles')
    .select(
      'id, full_name, role, target_role, experience_level, target_company_type, placement_timeline, ' +
        'speaking_pace, practice_without_score, onboarding_completed, ' +
        'user_skills (skill, self_rating, proven_score)',
    )
    .eq('id', req.user!.id)
    .single()

  if (error) return res.status(404).json({ error: 'Profile not found' })
  res.json({ ...(data as object), active_goal: await getActiveGoal(req.user!.id) })
})

// Rules for what the onboarding form may send. Anything else is rejected.
const onboardingSchema = z.object({
  target_role: z.enum(roleIds),
  experience_level: z.enum(experienceIds),
  target_company_type: z.enum(companyTypeIds),
  placement_timeline: z.enum(timelineIds),
  speaking_pace: z.enum(['slow', 'normal']),
  practice_without_score: z.boolean(),
  skills: z
    .array(z.object({ skill: z.string().trim().min(1).max(40), self_rating: z.number().int().min(1).max(5) }))
    .min(1, 'Pick at least one skill')
    .max(15),
})

// Save the onboarding answers.
profileRouter.put('/onboarding', requireAuth, async (req, res) => {
  const parsed = onboardingSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })

  const { skills, ...profileFields } = parsed.data
  const userId = req.user!.id

  const { error: profileError } = await supabase!
    .from('profiles')
    .update({ ...profileFields, onboarding_completed: true, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (profileError) return res.status(500).json({ error: profileError.message })

  // The role, company type and timeline become the student's first goal (or update the current one).
  const goalFields = {
    target_role: profileFields.target_role,
    company_type: profileFields.target_company_type,
    experience_level: profileFields.experience_level,
    target_date: timelineToTargetDate(profileFields.placement_timeline),
  }
  const active = await getActiveGoal(userId)
  if (active) await supabase!.from('goals').update(goalFields).eq('id', active.id)
  else await createGoal(userId, goalFields)

  const skillsError = await replaceSkills(userId, skills)
  if (skillsError) return res.status(500).json({ error: skillsError })

  res.json({ ok: true })
})

const skillsSchema = z
  .array(z.object({ skill: z.string().trim().min(1).max(40), self_rating: z.number().int().min(1).max(5) }))
  .min(1, 'Pick at least one skill')
  .max(15)

const profileSchema = z.object({
  full_name: z.string().trim().min(1, 'Please enter your name').max(80),
  experience_level: z.enum(experienceIds),
  speaking_pace: z.enum(['slow', 'normal']),
  practice_without_score: z.boolean(),
  skills: skillsSchema,
})

// The Profile and Settings pages: who you are (not what you're preparing for; that's a goal).
profileRouter.put('/profile', requireAuth, async (req, res) => {
  const parsed = profileSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })
  const { skills, ...fields } = parsed.data

  const { error } = await supabase!.from('profiles').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', req.user!.id)
  if (error) return res.status(500).json({ error: error.message })

  const skillsError = await replaceSkills(req.user!.id, skills)
  if (skillsError) return res.status(500).json({ error: skillsError })
  res.json({ ok: true })
})

// Replace the student's skills with a new list. Keeps proven scores for skills they still have.
async function replaceSkills(userId: string, rawSkills: { skill: string; self_rating: number }[]) {
  // If the same skill was sent twice, keep only the last one.
  const skills = [...new Map(rawSkills.map((s) => [s.skill, s])).values()]
  const { data: existing } = await supabase!.from('user_skills').select('skill, proven_score').eq('user_id', userId)
  const proven = new Map((existing ?? []).map((s) => [s.skill, s.proven_score]))

  await supabase!.from('user_skills').delete().eq('user_id', userId)
  const { error } = await supabase!.from('user_skills').insert(
    skills.map((s) => ({ user_id: userId, ...s, proven_score: proven.get(s.skill) ?? null })),
  )
  return error?.message ?? null
}
