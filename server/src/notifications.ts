import { supabase } from './db/supabase.js'
import { getActiveGoal } from './goals.js'
import { listSessions } from './stats.js'
import { getUsage } from './usage.js'
import { roundById } from './interview/rounds.js'

export type Notification = {
  id: string // stable, so the browser can remember which ones were already seen
  kind: 'report' | 'streak' | 'roadmap' | 'deadline' | 'limit' | 'welcome'
  title: string
  body: string
  link: string
  at: string
}

// Everything worth telling the student right now, newest first. Worked out fresh on each request.
export async function getNotifications(userId: string): Promise<Notification[]> {
  const [goal, sessions, usage] = await Promise.all([getActiveGoal(userId), listSessions(userId), getUsage(userId)])
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const out: Notification[] = []

  // 1. Feedback reports that finished in the last 14 days.
  for (const s of sessions) {
    if (s.reportStatus !== 'ready' || !s.completed_at) continue
    if (now.getTime() - new Date(s.completed_at).getTime() > 14 * 86_400_000) continue
    const name = s.mode === 'drill' ? `5-minute drill: ${s.focus_topic}` : s.mode === 'complete' ? 'Complete interview' : `${roundById(s.rounds[0]).label} round`
    out.push({ id: `report-${s.id}`, kind: 'report', title: 'Your feedback is ready', body: name, link: `/interview/${s.id}/report`, at: s.completed_at })
  }

  // 2. Practice reminder.
  const finished = sessions.filter((s) => s.completed_at)
  const practisedToday = finished.some((s) => s.completed_at!.slice(0, 10) === today)
  if (finished.length === 0) {
    out.push({ id: 'welcome', kind: 'welcome', title: 'Start with your first interview', body: 'Answer up to 10 questions and see exactly what to work on.', link: '/practice', at: now.toISOString() })
  } else if (!practisedToday && usage.interviews.used < usage.interviews.limit) {
    out.push({ id: `practice-${today}`, kind: 'streak', title: 'A little practice today?', body: 'A 5-minute drill keeps your streak and your confidence going.', link: '/home', at: now.toISOString() })
  }

  if (goal) {
    // 3. Roadmap tasks left in the current week.
    const { data: tasks } = await supabase!.from('roadmap_tasks').select('week, done').eq('goal_id', goal.id)
    const pending = (tasks ?? []).filter((t) => !t.done)
    if (pending.length) {
      const week = Math.min(...pending.map((t) => t.week))
      const left = pending.filter((t) => t.week === week).length
      out.push({ id: `roadmap-${goal.id}-w${week}-${left}`, kind: 'roadmap', title: `${left} roadmap task${left === 1 ? '' : 's'} this week`, body: `Week ${week} of your study plan`, link: '/roadmap', at: now.toISOString() })
    }

    // 4. Target date coming up.
    if (goal.target_date) {
      const days = Math.ceil((new Date(goal.target_date).getTime() - now.getTime()) / 86_400_000)
      if (days >= 0 && days <= 7) {
        out.push({ id: `deadline-${goal.id}-${days}`, kind: 'deadline', title: days === 0 ? 'Your target date is today. You\'ve got this!' : `Your target date is in ${days} day${days === 1 ? '' : 's'}`, body: 'A complete interview is a great final warm-up.', link: '/practice', at: now.toISOString() })
      }
    }
  }

  // 5. Daily limit reached.
  if (usage.interviews.used >= usage.interviews.limit) {
    out.push({ id: `limit-${today}`, kind: 'limit', title: "You've used today's interviews", body: 'Drills are still available. New interviews unlock at midnight.', link: '/practice', at: now.toISOString() })
  }

  return out.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12)
}
