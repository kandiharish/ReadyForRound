import { supabase } from '../db/supabase.js'
import { chat, LlmUnavailableError } from '../llm/client.js'
import { catalog } from '../catalog.js'
import { offRound, buildMessages, parseAiReply, type AiReply, type InterviewContext, type NextStep, type Turn } from './prompts.js'
import { COMPLETE_SEQUENCES, MAX_FOLLOW_UPS_PER_QUESTION, QUESTIONS_PER_ROUND, type RoundId } from './rounds.js'
import { isGenerating, startReport } from '../report/generate.js'
import { getActiveGoal } from '../goals.js'
import { limitReached } from '../usage.js'
import { getResume, resumeForPrompt } from '../resume.js'
import { companyById } from '../companies.js'
import { getJob, JobError, jobForPrompt } from '../jobs.js'
import type { SpeechStats } from '../stt/speech.js'

export class InterviewError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

const db = () => {
  if (!supabase) throw new InterviewError(503, 'Database is not configured')
  return supabase
}

// Interviewers ask with a question mark ("Why did you...?") or as an instruction ("Explain the box model.").
// Both are fine; statements like "You scored 6/10." are not.
const PROMPT_VERBS = /^(explain|describe|walk me through|tell me|talk me through|take me through|compare|design|write|outline|share|give me|list|discuss|show me|imagine|suppose|say)\b/i
export function isAQuestion(text: string) {
  const t = text.trim()
  if (t.includes('?')) return true
  // The instruction is often the last sentence, after a short lead-in ("Nice. Explain how...")
  return t.split(/(?<=[.!])\s+/).some((sentence) => PROMPT_VERBS.test(sentence.trim()))
}

// Ask the AI for the next step, and check its reply is usable. One retry if it isn't.
async function askAi(ctx: InterviewContext, round: RoundId, turns: Turn[], step: NextStep, progress?: { next: number; total: number }): Promise<AiReply> {
  let nudge = ''
  const defaultType = step.kind === 'follow_up_or_done' ? 'follow_up' : 'new_question'
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const reply = await chat(buildMessages(ctx, round, turns, step, progress, nudge), { temperature: 0.7, maxTokens: 200 })
      const parsed = parseAiReply(reply.text, defaultType)
      // The backend, not the AI, decides what's allowed: a follow-up is only a follow-up if we permitted one.
      if (step.kind === 'new_only' || step.kind === 'start_round') parsed.type = 'new_question'
      if (parsed.type === 'done' && step.kind !== 'follow_up_or_done') {
        nudge = 'Your last reply tried to end the interview. Do not end it. Ask the next interview question now.'
        throw new Error('"done" not allowed here')
      }
      // Every interviewer turn must actually be a question (this also catches replies like "You scored 6/10.").
      if (parsed.type !== 'done' && (!isAQuestion(parsed.question) || parsed.question.length > 600)) {
        throw new Error(`unusable question: ${reply.text.slice(0, 100)}`)
      }
      // Keep each round to its own kind of question (no technical questions in Behavioural or HR, and vice versa).
      const wrongRound = parsed.type === 'done' ? null : offRound(parsed.question, round, ctx)
      if (wrongRound && attempt < 3) {
        nudge = wrongRound
        throw new Error(`off-round question in ${round}: ${parsed.question.slice(0, 100)}`)
      }
      return parsed
    } catch (err) {
      console.warn(`AI reply attempt ${attempt} failed: ${(err as Error).message}`)
      // No point retrying if the AI service isn't there at all.
      if (err instanceof LlmUnavailableError) {
        throw new InterviewError(503, 'The AI interviewer is offline right now. Please try again in a minute.')
      }
    }
  }
  // It kept trying to wrap up this round: let it, rather than show the student an error.
  if (nudge.startsWith('Your last reply tried to end')) return { type: 'done', question: '' }
  throw new InterviewError(502, 'The AI interviewer did not respond properly. Please try again.')
}

// Build the snapshot of the student used for every question in this interview.
// Build the snapshot of the student used for every question in this interview:
// what they're preparing for comes from their active goal, who they are from their profile.
async function loadContext(userId: string): Promise<{ ctx: InterviewContext; companyType: string; goalId: string; goalRole: string }> {
  const { data: p } = await db()
    .from('profiles')
    .select('full_name, speaking_pace, onboarding_completed, user_skills (skill, self_rating)')
    .eq('id', userId)
    .single()
  if (!p?.onboarding_completed) throw new InterviewError(400, 'Please complete your profile first')
  const goal = await getActiveGoal(userId)
  if (!goal) throw new InterviewError(400, 'Choose a goal first, so we know what to prepare you for')

  const label = (list: readonly { id: string; label: string }[], id: string | null) => list.find((o) => o.id === id)?.label ?? ''
  const ctx: InterviewContext = {
    firstName: (p.full_name ?? 'there').split(' ')[0],
    roleLabel: label(catalog.roles, goal.target_role),
    experienceLabel: label(catalog.experienceLevels, goal.experience_level),
    companyTypeLabel: label(catalog.companyTypes, goal.company_type),
    skills: p.user_skills,
    speakingPace: p.speaking_pace,
    roleFocus: roleFocus(goal.target_role),
  }
  // If they uploaded a resume, the interviewer asks about their own projects and experience.
  const resume = await getResume(userId)
  if (resume) ctx.resume = resumeForPrompt(resume.summary)
  return { ctx, companyType: goal.company_type, goalId: goal.id, goalRole: goal.target_role }
}

// Core topics for core-engineering roles (only those roles define them)
function roleFocus(roleId: string): string | undefined {
  const role = catalog.roles.find((r) => r.id === roleId)
  return role && 'focus' in role ? role.focus : undefined
}

export type Mode = 'single' | 'complete' | 'drill'

export async function startInterview(userId: string, mode: Mode, round?: RoundId, topic?: string, companyId?: string, roleId?: string, jobId?: string) {
  // Daily limits protect the free AI quota for everyone.
  const limitMessage = await limitReached(userId, mode === 'drill' ? 'drill' : 'interview')
  if (limitMessage) throw new InterviewError(429, limitMessage)

  const { ctx, companyType, goalId, goalRole } = await loadContext(userId)
  if (mode === 'drill') ctx.focusTopic = topic

  // Company-style interview: their round sequence, their style, and a role they hire for.
  const company = companyId ? companyById(companyId) : undefined
  if (companyId && !company) throw new InterviewError(400, 'Unknown company')
  if (company) {
    const role = roleId ?? (company.roles.includes(goalRole) ? goalRole : company.roles[0])
    if (!company.roles.includes(role)) throw new InterviewError(400, `Choose a role that ${company.name} hires for`)
    ctx.roleLabel = catalog.roles.find((r) => r.id === role)?.label ?? ctx.roleLabel
    ctx.roleFocus = roleFocus(role)
    ctx.companyTypeLabel = catalog.companyTypes.find((t) => t.id === company.type)?.label ?? ctx.companyTypeLabel
    ctx.company = { id: company.id, name: company.name, style: company.style, lookFor: company.lookFor, rounds: company.rounds }
    if (mode === 'single' && !company.rounds.some((r) => r.id === round)) throw new InterviewError(400, `${company.name} interviews don't include that round`)
  }
  // Practising for a pasted job ad: the interviewer aims at that job's skills and duties.
  let jobTitle: string | null = null
  if (jobId) {
    if (company) throw new InterviewError(400, 'Choose either a company-style interview or a job ad, not both')
    const job = await getJob(userId, jobId).catch((err) => { throw err instanceof JobError ? new InterviewError(err.status, err.message) : err })
    ctx.job = jobForPrompt(job)
    jobTitle = job.company ? `${job.title} · ${job.company}` : job.title
  }
  if (round === 'resume' && !ctx.resume) throw new InterviewError(400, 'Add your resume on your Profile first, so the interviewer has something to ask about.')
  const rounds: RoundId[] = mode === 'complete'
    ? (company ? company.rounds.map((r) => r.id) : COMPLETE_SEQUENCES[companyType])
    : mode === 'drill' ? ['technical'] : [round!]

  // Get the first question BEFORE saving anything, so an AI failure leaves no half-created interview.
  const first = await askAi(ctx, rounds[0], [], { kind: 'start_round', isFirstRound: true })

  // Only one interview in progress at a time: close any older unfinished ones.
  await db().from('interview_sessions').update({ status: 'ended_early' }).eq('user_id', userId).eq('status', 'in_progress')

  const { data: session, error } = await db()
    .from('interview_sessions')
    .insert({ user_id: userId, goal_id: goalId, mode, rounds, context: ctx, focus_topic: mode === 'drill' ? topic : null, company_id: company?.id ?? null, job_id: jobId ?? null, job_title: jobTitle })
    .select('id')
    .single()
  if (error) throw new InterviewError(500, error.message)

  await db().from('interview_turns').insert({ session_id: session.id, round: rounds[0], seq: 1, question: first.question })
  return getInterview(userId, session.id)
}

export async function getInterview(userId: string, sessionId: string) {
  const { data, error } = await db()
    .from('interview_sessions')
    .select('id, mode, rounds, current_round_index, status, context, focus_topic, company_id, job_title, created_at, completed_at, ' +
      'interview_turns (seq, round, question, is_follow_up, answer, skipped, speech)')
    .eq('id', sessionId)
    .eq('user_id', userId) // a student can only open their own interviews
    .order('seq', { referencedTable: 'interview_turns' })
    .single()
  if (error || !data) throw new InterviewError(404, 'Interview not found')

  const { interview_turns, ...session } = data as unknown as SessionRow & { interview_turns: (Turn & { seq: number })[] }
  return {
    ...session,
    questionsPerRound: QUESTIONS_PER_ROUND[session.mode],
    turns: interview_turns,
  }
}

type SessionRow = {
  id: string
  mode: Mode
  rounds: RoundId[]
  focus_topic: string | null
  current_round_index: number
  status: 'in_progress' | 'completed' | 'ended_early'
  context: InterviewContext
  created_at: string
  completed_at: string | null
}

export async function listInterviews(userId: string) {
  const { data } = await db()
    .from('interview_sessions')
    .select('id, mode, rounds, status, company_id, job_title, created_at, completed_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)
  return data ?? []
}

// speech: delivery numbers for a spoken answer (speaking coach); typed answers have none.
export async function answerQuestion(userId: string, sessionId: string, answer: string | null, speech?: SpeechStats) {
  const session = await getInterview(userId, sessionId)
  if (session.status !== 'in_progress') throw new InterviewError(409, 'This interview has already finished')

  const turns = session.turns
  const current = turns[turns.length - 1]
  if (current.answer !== null) throw new InterviewError(409, 'This question was already answered')

  const skipped = answer === null
  const answered: Turn = { ...current, answer: skipped ? '' : answer, skipped }
  const updatedTurns = [...turns.slice(0, -1), answered]

  // Work out where we are in the current round.
  const ctx = session.context
  let roundIndex: number = session.current_round_index
  const round = session.rounds[roundIndex] as RoundId
  const roundTurns = updatedTurns.filter((t) => t.round === round)
  const mainAsked = roundTurns.filter((t) => !t.is_follow_up).length
  const lastMainIdx = roundTurns.map((t) => t.is_follow_up).lastIndexOf(false)
  const followUpsSinceMain = roundTurns.length - 1 - lastMainIdx
  const mainLeft = session.questionsPerRound - mainAsked
  const followUpAllowed = session.mode !== 'drill' && !skipped && followUpsSinceMain < MAX_FOLLOW_UPS_PER_QUESTION

  // Decide what the AI may do next, then ask it.
  let next: { round: RoundId; reply: AiReply } | null = null
  if (mainLeft > 0) {
    const reply = await askAi(ctx, round, updatedTurns, { kind: followUpAllowed ? 'follow_up_or_new' : 'new_only' }, { next: mainAsked + 1, total: session.questionsPerRound })
    if (reply.type !== 'done') next = { round, reply } // "done" here means the AI insisted the round is over: move on
  } else if (followUpAllowed) {
    const reply = await askAi(ctx, round, updatedTurns, { kind: 'follow_up_or_done' })
    if (reply.type !== 'done') next = { round, reply: { ...reply, type: 'follow_up' } }
  }

  // Round finished: move to the next round, or finish the interview.
  if (!next && roundIndex + 1 < session.rounds.length) {
    roundIndex += 1
    const nextRound = session.rounds[roundIndex] as RoundId
    const reply = await askAi(ctx, nextRound, updatedTurns, { kind: 'start_round', isFirstRound: false }, { next: 1, total: session.questionsPerRound })
    next = { round: nextRound, reply: { ...reply, type: 'new_question' } }
  }

  // Save the answer. The "answer is null" condition stops a double-click from saving twice.
  const { data: saved } = await db()
    .from('interview_turns')
    .update({ answer: answered.answer, skipped, answered_at: new Date().toISOString(), speech: skipped ? null : speech ?? null })
    .eq('session_id', sessionId)
    .eq('seq', current.seq)
    .is('answer', null)
    .select('seq')
  if (!saved?.length) throw new InterviewError(409, 'This question was already answered')

  if (next) {
    await db().from('interview_turns').insert({
      session_id: sessionId,
      round: next.round,
      seq: current.seq + 1,
      question: next.reply.question,
      is_follow_up: next.reply.type === 'follow_up',
    })
    await db().from('interview_sessions').update({ current_round_index: roundIndex }).eq('id', sessionId)
  } else {
    await db().from('interview_sessions')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', sessionId)
    startReport(sessionId) // grade the answers in the background
  }

  return getInterview(userId, sessionId)
}

export async function endInterview(userId: string, sessionId: string) {
  const { data } = await db()
    .from('interview_sessions')
    .update({ status: 'ended_early', completed_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', userId)
    .eq('status', 'in_progress')
    .select('id')
  if (!data?.length) throw new InterviewError(404, 'No interview in progress with that id')
  const interview = await getInterview(userId, sessionId)
  // Even an interview ended early gets a report, as long as at least one question was answered.
  if (interview.turns.some((t) => t.answer !== null)) startReport(sessionId)
  return interview
}

// The report for a finished interview. Starts (or restarts) making it if needed.
export async function getReport(userId: string, sessionId: string) {
  const interview = await getInterview(userId, sessionId) // also checks the interview belongs to this student
  if (interview.status === 'in_progress') throw new InterviewError(409, 'The interview is still in progress')
  if (!interview.turns.some((t) => t.answer !== null)) return { status: 'empty' as const }

  const { data: row } = await db().from('interview_reports').select('status, report').eq('session_id', sessionId).maybeSingle()
  // No report yet, or one that was being made when the server restarted: (re)start it.
  if (!row || (row.status === 'generating' && !isGenerating(sessionId))) {
    startReport(sessionId)
    return { status: 'generating' as const }
  }
  return { status: row.status, report: row.report }
}

export async function retryReport(userId: string, sessionId: string) {
  await getInterview(userId, sessionId)
  startReport(sessionId)
  return { status: 'generating' as const }
}
