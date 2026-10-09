import { z } from 'zod'
import { supabase } from './db/supabase.js'
import { chat } from './llm/client.js'
import { catalog } from './catalog.js'
import { getActiveGoal, type Goal } from './goals.js'
import { listSessions } from './stats.js'

// The shape the AI must return. Anything else is rejected before it reaches the database.
const taskSchema = z.object({
  kind: z.enum(['learn', 'practice', 'build', 'mock']),
  title: z.string().min(3).max(120),
  detail: z.string().max(400).default(''),
  topic: z.string().max(80).nullable().optional(),
  minutes: z.coerce.number().int().min(5).max(240),
  why: z.string().max(200).default(''),
})
const planSchema = z.object({
  weeks: z.array(z.object({ week: z.coerce.number().int().min(1).max(52), tasks: z.array(taskSchema).min(1).max(8) })).min(1).max(12),
})

const label = (list: readonly { id: string; label: string }[], id: string) => list.find((o) => o.id === id)?.label ?? id

// Collect what we know about the student's gaps: report feedback, weak questions, claimed vs proven skills.
async function gatherEvidence(userId: string, goal: Goal) {
  const sessions = (await listSessions(userId)).filter((s) => s.goal_id === goal.id && s.score !== null).slice(0, 3)
  const reportIds = sessions.map((s) => s.id)
  const { data: reports } = reportIds.length
    ? await supabase!.from('interview_reports').select('report').in('session_id', reportIds)
    : { data: [] as { report: any }[] }

  const studyNext = (reports ?? []).flatMap((r) => r.report?.studyNext ?? []).map((s: any) => `${s.topic}: ${s.why}`)
  const improvements = (reports ?? []).flatMap((r) => r.report?.improvements ?? [])
  const weakPoints = (reports ?? []).flatMap((r) => (r.report?.questions ?? [])
    .filter((q: any) => q.score !== null && q.score < 6)
    .flatMap((q: any) => q.missing ?? []))

  const { data: skills } = await supabase!.from('user_skills').select('skill, self_rating, proven_score').eq('user_id', userId)
  return { studyNext, improvements, weakPoints, skills: skills ?? [], interviews: sessions.length }
}

export async function generateRoadmap(userId: string) {
  const goal = await getActiveGoal(userId)
  if (!goal) throw new Error('Create a goal first')

  const daysLeft = goal.target_date ? Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / 86_400_000) : null
  const weeks = daysLeft === null ? 6 : Math.max(1, Math.min(12, Math.ceil(daysLeft / 7)))
  const ev = await gatherEvidence(userId, goal)

  const skillLines = ev.skills.map((s) => `- ${s.skill}: says ${s.self_rating}/5, proven ${s.proven_score ?? 'not tested yet'}/100`).join('\n')
  const system = [
    'You are an expert career coach who writes practical, realistic study plans for interview preparation.',
    `Student: ${label(catalog.experienceLevels, goal.experience_level)}, preparing for ${label(catalog.roles, goal.target_role)} at a ${label(catalog.companyTypes, goal.company_type).toLowerCase()}.`,
    `Plan length: ${weeks} week(s). Time available: about ${goal.weekly_hours} hours per week, so each week's tasks must add up to roughly ${goal.weekly_hours * 60} minutes.`,
    '',
    'Rules:',
    '- Put the biggest gaps first. Every task must say WHY (which gap it fixes) in one short sentence.',
    '- Mix kinds each week: "learn" (read/watch a concept), "practice" (exercises or a quick drill), "build" (a small hands-on piece), "mock" (a mock interview round). End most weeks with a "mock".',
    '- Be specific and correct (e.g. "Closures and stale state in React event handlers", not "Learn React").',
    '- NEVER include URLs or links. In "detail", you may suggest what to search for, e.g. \'Search "MDN closures"\'.',
    '- "topic" is a short name (2 to 5 words) usable for a 5-minute drill, or null for build/mock tasks.',
    '',
    'Reply with JSON only, in this shape:',
    '{"weeks":[{"week":1,"tasks":[{"kind":"learn","title":"...","detail":"...","topic":"...","minutes":45,"why":"..."}]}]}',
  ].join('\n')

  const user = [
    `Skills:\n${skillLines || '- none listed'}`,
    ev.interviews
      ? `From their last ${ev.interviews} interview report(s):\nStudy next: ${ev.studyNext.join('; ') || 'none'}\nTo improve: ${ev.improvements.join('; ') || 'none'}\nMissing in weak answers: ${ev.weakPoints.slice(0, 12).join('; ') || 'none'}`
      : 'No interviews yet: build a starter plan from the role, the skills above and the most common interview topics for this role.',
  ].join('\n\n')

  let plan: z.infer<typeof planSchema> | null = null
  for (let attempt = 1; attempt <= 2 && !plan; attempt++) {
    try {
      const reply = await chat([{ role: 'system', content: system }, { role: 'user', content: user }], { task: 'report', json: true, temperature: 0.4, maxTokens: 3000 })
      plan = planSchema.parse(JSON.parse(reply.text))
    } catch (err) {
      console.warn(`Roadmap attempt ${attempt} failed: ${(err as Error).message.slice(0, 200)}`)
    }
  }
  if (!plan) throw new Error('The AI could not build a roadmap right now. Please try again.')

  // Keep finished tasks (the student's progress); replace everything not done yet.
  await supabase!.from('roadmap_tasks').delete().eq('goal_id', goal.id).eq('done', false)
  const rows = plan.weeks.flatMap((w) => w.tasks.map((t, i) => ({
    goal_id: goal.id,
    week: Math.min(w.week, weeks),
    position: i,
    kind: t.kind,
    title: t.title,
    detail: t.detail.replace(/https?:\/\/\S+/g, ''), // belt and braces: strip any link the AI still added
    topic: t.topic ?? null,
    minutes: t.minutes,
    why: t.why,
  })))
  const { error } = await supabase!.from('roadmap_tasks').insert(rows)
  if (error) throw new Error(error.message)
  return getRoadmap(userId)
}

export async function getRoadmap(userId: string) {
  const goal = await getActiveGoal(userId)
  if (!goal) return { goal: null, tasks: [] }
  const { data } = await supabase!
    .from('roadmap_tasks')
    .select('id, week, position, kind, title, detail, topic, minutes, why, done, done_at')
    .eq('goal_id', goal.id)
    .order('week')
    .order('position')
  return { goal, tasks: data ?? [] }
}

export async function setTaskDone(userId: string, taskId: number, done: boolean) {
  const goal = await getActiveGoal(userId)
  if (!goal) return false
  const { data } = await supabase!
    .from('roadmap_tasks')
    .update({ done, done_at: done ? new Date().toISOString() : null })
    .eq('id', taskId)
    .eq('goal_id', goal.id) // only tasks from this student's own goal
    .select('id')
  return !!data?.length
}

// A topic for today's 5-minute drill: the next roadmap topic, else the latest "study next", else the weakest skill.
// sessions / skills: pass them in when the caller already has them, to save database calls
export async function suggestDrillTopic(userId: string, goal: Goal, sessions?: { goal_id: string | null; score: number | null; id: string }[], skillsIn?: { skill: string; self_rating: number; proven_score: number | null }[]) {
  const { data: next } = await supabase!.from('roadmap_tasks').select('topic').eq('goal_id', goal.id).eq('done', false)
    .not('topic', 'is', null).order('week').order('position').limit(1)
  if (next?.[0]?.topic) return next[0].topic as string

  const scored = (sessions ?? await listSessions(userId)).find((s) => s.goal_id === goal.id && s.score !== null)
  if (scored) {
    const { data } = await supabase!.from('interview_reports').select('report').eq('session_id', scored.id).single()
    const topic = data?.report?.studyNext?.[0]?.topic
    if (topic) return String(topic).slice(0, 80)
  }

  const skills = skillsIn ?? (await supabase!.from('user_skills').select('skill, self_rating, proven_score').eq('user_id', userId)).data
  const weakest = [...(skills ?? [])].sort((a, b) => (a.proven_score ?? a.self_rating * 20) - (b.proven_score ?? b.self_rating * 20))[0]
  return weakest ? `${weakest.skill} fundamentals` : 'Core concepts for your role'
}
