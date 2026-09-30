import { supabase } from './db/supabase.js'

export type Goal = {
  id: string
  target_role: string
  company_type: string
  experience_level: string
  target_date: string | null
  weekly_hours: number
  status: 'active' | 'achieved' | 'archived'
  created_at: string
  finished_at: string | null
}

const GOAL_FIELDS = 'id, target_role, company_type, experience_level, target_date, weekly_hours, status, created_at, finished_at'

export async function getActiveGoal(userId: string): Promise<Goal | null> {
  const { data } = await supabase!.from('goals').select(GOAL_FIELDS).eq('user_id', userId).eq('status', 'active').maybeSingle()
  return data as Goal | null
}

export async function listGoals(userId: string): Promise<Goal[]> {
  const { data } = await supabase!.from('goals').select(GOAL_FIELDS).eq('user_id', userId).order('created_at', { ascending: false })
  return (data ?? []) as Goal[]
}

// Make a new goal the active one. The previous active goal is paused ("archived"), not deleted.
export async function createGoal(userId: string, fields: Omit<Goal, 'id' | 'status' | 'created_at' | 'finished_at' | 'weekly_hours'> & { weekly_hours?: number }) {
  await supabase!.from('goals').update({ status: 'archived', finished_at: new Date().toISOString() }).eq('user_id', userId).eq('status', 'active')
  const { data, error } = await supabase!.from('goals').insert({ user_id: userId, ...fields }).select(GOAL_FIELDS).single()
  if (error) throw new Error(error.message)
  return data as Goal
}
