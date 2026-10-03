import { supabase } from './db/supabase.js'
import { getActiveGoal, listGoals, type Goal } from './goals.js'
import { COMPLETE_SEQUENCES, type RoundId } from './interview/rounds.js'
import { getUsage } from './usage.js'
import { suggestDrillTopic } from './roadmap.js'

type QuestionScore = { round: RoundId; score: number | null; skipped: boolean }

export type SessionSummary = {
  id: string
  goal_id: string | null
  mode: 'single' | 'complete' | 'drill'
  focus_topic: string | null
  rounds: RoundId[]
  status: 'in_progress' | 'completed' | 'ended_early'
  created_at: string
  completed_at: string | null
  reportStatus: 'generating' | 'ready' | 'failed' | null
  score: number | null // overall report score 0..100
  questions: QuestionScore[]
}

// All of a student's interviews (newest first), with their report score when there is one.
export async function listSessions(userId: string): Promise<SessionSummary[]> {
  const { data } = await supabase!
    .from('interview_sessions')
    .select('id, goal_id, mode, rounds, focus_topic, company_id, status, created_at, completed_at, interview_reports (status, score:report->overallScore, questions:report->questions)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200)

  return (data ?? []).map((row: any) => {
    const rep = Array.isArray(row.interview_reports) ? row.interview_reports[0] : row.interview_reports
    const { interview_reports, ...s } = row
    return {
      ...s,
      reportStatus: rep?.status ?? null,
      score: rep?.status === 'ready' && typeof rep.score === 'number' ? rep.score : null,
      questions: rep?.status === 'ready' && Array.isArray(rep.questions) ? rep.questions : [],
    }
  })
}

const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null)

// Readiness = average score of the latest 3 graded interviews; delta = change from the 3 before that.
export function readiness(sessions: SessionSummary[]) {
  const scores = sessions.filter((s) => s.score !== null).map((s) => s.score!)
  const current = avg(scores.slice(0, 3))
  const previous = avg(scores.slice(3, 6))
  return { score: current, delta: current !== null && previous !== null ? current - previous : null, graded: scores.length }
}

// Average question score per round (0..100), from graded reports.
function roundScores(sessions: SessionSummary[], rounds: RoundId[]) {
  return rounds.map((round) => {
    const scores = sessions.flatMap((s) => s.questions).filter((q) => q.round === round && q.score !== null).map((q) => q.score! * 10)
    return { round, score: avg(scores) }
  })
}

// What to practise next: a round never tried, else the weakest round, else a full interview.
function recommend(perRound: { round: RoundId; score: number | null }[], hasInterviews: boolean) {
  if (!hasInterviews) return { mode: 'complete' as const, reason: 'Start with a full interview so we can find your strengths and gaps.' }
  const untried = perRound.find((r) => r.score === null)
  if (untried) return { mode: 'single' as const, round: untried.round, reason: "You haven't practised this round yet." }
  const weakest = [...perRound].sort((a, b) => a.score! - b.score!)[0]
  if (weakest && weakest.score! < 70) {
    return { mode: 'single' as const, round: weakest.round, reason: `This is your lowest round so far (${weakest.score}/100).` }
  }
  return { mode: 'complete' as const, reason: 'Every round is looking good. Test yourself with a full interview.' }
}

// Consecutive days (up to today) with at least one finished interview, and which days of this week had one.
function streak(sessions: SessionSummary[]) {
  const day = (d: Date) => d.toISOString().slice(0, 10)
  const days = new Set(sessions.filter((s) => s.completed_at).map((s) => day(new Date(s.completed_at!))))
  const today = new Date()
  let count = 0
  const cursor = new Date(today)
  if (!days.has(day(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1) // today not done yet: count up to yesterday
  while (days.has(day(cursor))) { count++; cursor.setUTCDate(cursor.getUTCDate() - 1) }

  const monday = new Date(today)
  monday.setUTCDate(today.getUTCDate() - ((today.getUTCDay() + 6) % 7))
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setUTCDate(monday.getUTCDate() + i)
    return { date: day(d), done: days.has(day(d)), isToday: day(d) === day(today) }
  })
  return { days: count, week }
}

export async function homeStats(userId: string) {
  const goal = await getActiveGoal(userId)
  const all = await listSessions(userId)
  const forGoal = goal ? all.filter((s) => s.goal_id === goal.id) : []
  const finished = forGoal.filter((s) => s.status !== 'in_progress')
  // Drills are short practice on weak topics, so they don't count towards readiness or round scores.
  const interviews = finished.filter((s) => s.mode !== 'drill')
  const sequence = COMPLETE_SEQUENCES[goal?.company_type ?? 'any']
  const perRound = roundScores(interviews, sequence)

  const { data: skills } = await supabase!.from('user_skills').select('skill, self_rating, proven_score').eq('user_id', userId)
  const weekAgo = Date.now() - 7 * 86_400_000

  return {
    goal,
    readiness: readiness(interviews),
    roundScores: perRound,
    recommendation: recommend(perRound, interviews.length > 0),
    streak: streak(all),
    daysLeft: goal?.target_date ? Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / 86_400_000) : null,
    inProgress: forGoal.find((s) => s.status === 'in_progress') ?? null,
    usage: await getUsage(userId),
    drillTopic: goal ? await suggestDrillTopic(userId, goal) : null,
    recent: finished.slice(0, 5).map(({ questions, ...s }) => s),
    counts: { total: interviews.length, drills: finished.length - interviews.length, thisWeek: finished.filter((s) => new Date(s.created_at).getTime() > weekAgo).length },
    skills: skills ?? [],
  }
}

// Every goal with its progress: interviews done, first and latest readiness.
export async function goalsWithStats(userId: string) {
  const [goals, sessions] = await Promise.all([listGoals(userId), listSessions(userId)])
  return goals.map((g: Goal) => {
    const mine = sessions.filter((s) => s.goal_id === g.id && s.status !== 'in_progress' && s.mode !== 'drill')
    const graded = mine.filter((s) => s.score !== null)
    return {
      ...g,
      interviews: mine.length,
      readiness: readiness(mine).score,
      startedAt: avg(graded.slice(-3).map((s) => s.score!)), // oldest 3 graded interviews
    }
  })
}
