import { config } from './config.js'
import { supabase } from './db/supabase.js'

// When "today" started and when it ends, in the app's time zone (India by default).
function todayWindow() {
  const offset = config.TIMEZONE_OFFSET_MINUTES * 60_000
  const localNow = Date.now() + offset
  const localMidnight = localNow - (localNow % 86_400_000)
  const start = new Date(localMidnight - offset)
  return { start, resetsAt: new Date(start.getTime() + 86_400_000) }
}

export type Usage = {
  plan: 'free' | 'pro'
  interviews: { used: number; limit: number }
  drills: { used: number; limit: number }
  resetsAt: string
}

// How much the student has used today, and their limits.
export async function getUsage(userId: string): Promise<Usage> {
  const { start, resetsAt } = todayWindow()
  const [{ data: profile }, { data: sessions }, { count: discussions }] = await Promise.all([
    supabase!.from('profiles').select('plan').eq('id', userId).single(),
    supabase!.from('interview_sessions').select('mode').eq('user_id', userId).gte('created_at', start.toISOString()),
    // A group discussion uses about as much AI as an interview, so it counts as one
    supabase!.from('gd_sessions').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', start.toISOString()),
  ])
  const plan = (profile?.plan ?? 'free') as Usage['plan']
  const drills = (sessions ?? []).filter((s) => s.mode === 'drill').length
  return {
    plan,
    interviews: { used: (sessions ?? []).length - drills + (discussions ?? 0), limit: plan === 'pro' ? config.DAILY_INTERVIEWS_PRO : config.DAILY_INTERVIEWS_FREE },
    drills: { used: drills, limit: plan === 'pro' ? config.DAILY_DRILLS_PRO : config.DAILY_DRILLS_FREE },
    resetsAt: resetsAt.toISOString(),
  }
}

// Returns a friendly message if the student has reached today's limit for this kind of session, else null.
export async function limitReached(userId: string, kind: 'interview' | 'drill') {
  const usage = await getUsage(userId)
  const bucket = kind === 'drill' ? usage.drills : usage.interviews
  if (bucket.used < bucket.limit) return null
  return kind === 'drill'
    ? `You've done all ${bucket.limit} drills for today. Great work! New drills unlock at midnight.`
    : `You've used your ${bucket.limit} interviews for today. Take a break, review your reports, and come back tomorrow.`
}
