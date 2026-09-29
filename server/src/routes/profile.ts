import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../db/supabase.js'
import { requireAuth } from '../auth/requireAuth.js'
import { catalog, companyTypeIds, experienceIds, roleIds, timelineIds } from '../catalog.js'

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
  res.json(data)
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

  const { skills: rawSkills, ...profileFields } = parsed.data
  const userId = req.user!.id
  // If the same skill was sent twice, keep only the last one.
  const skills = [...new Map(rawSkills.map((s) => [s.skill, s])).values()]

  const { error: profileError } = await supabase!
    .from('profiles')
    .update({ ...profileFields, onboarding_completed: true, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (profileError) return res.status(500).json({ error: profileError.message })

  // Replace the student's skills with the new list. Keep proven scores for skills they still have.
  const { data: existing } = await supabase!.from('user_skills').select('skill, proven_score').eq('user_id', userId)
  const proven = new Map((existing ?? []).map((s) => [s.skill, s.proven_score]))

  await supabase!.from('user_skills').delete().eq('user_id', userId)
  const { error: skillsError } = await supabase!.from('user_skills').insert(
    skills.map((s) => ({ user_id: userId, ...s, proven_score: proven.get(s.skill) ?? null })),
  )
  if (skillsError) return res.status(500).json({ error: skillsError.message })

  res.json({ ok: true })
})
