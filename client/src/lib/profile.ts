import { apiFetch } from './api'
import type { Profile } from '../types'

export type ProfileUpdate = {
  full_name: string
  experience_level: string
  speaking_pace: 'slow' | 'normal'
  practice_without_score: boolean
  skills: { skill: string; self_rating: number }[]
}

// Save the profile. Pass only what changed; the rest is taken from the current profile.
export function saveProfile(me: Profile, changes: Partial<ProfileUpdate>) {
  const body: ProfileUpdate = {
    full_name: me.full_name ?? '',
    experience_level: me.experience_level ?? 'final_year',
    speaking_pace: me.speaking_pace,
    practice_without_score: me.practice_without_score,
    skills: me.user_skills.map((s) => ({ skill: s.skill, self_rating: s.self_rating })),
    ...changes,
  }
  return apiFetch('/profile', { method: 'PUT', body: JSON.stringify(body) })
}
