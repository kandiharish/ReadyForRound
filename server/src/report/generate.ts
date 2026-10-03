import { supabase } from '../db/supabase.js'
import { logError } from '../errors.js'
import { chat } from '../llm/client.js'
import type { InterviewContext } from '../interview/prompts.js'
import type { RoundId } from '../interview/rounds.js'
import { gradeMessages, parseGrade, parseSummary, summaryMessages, type QuestionFeedback, type Report } from './prompts.js'

const running = new Set<string>() // interviews whose report is being made right now (in this server process)

// Rounds where a question really tests a technical skill, so it counts towards "proven" skill scores.
const SKILL_ROUNDS: RoundId[] = ['technical', 'project']

// Start making the report in the background. Safe to call more than once.
export function startReport(sessionId: string) {
  if (running.has(sessionId)) return
  running.add(sessionId)
  generate(sessionId)
    .catch(async (err) => {
      logError('server', err as Error, { path: `report ${sessionId}` })
      await supabase!.from('interview_reports')
        .update({ status: 'failed', error: String((err as Error).message).slice(0, 500), updated_at: new Date().toISOString() })
        .eq('session_id', sessionId)
    })
    .finally(() => running.delete(sessionId))
}

export function isGenerating(sessionId: string) {
  return running.has(sessionId)
}

async function generate(sessionId: string) {
  const db = supabase!
  await db.from('interview_reports').upsert({ session_id: sessionId, status: 'generating', report: null, error: null, updated_at: new Date().toISOString() })

  const { data: session, error } = await db
    .from('interview_sessions')
    .select('user_id, context, interview_turns (seq, round, question, answer, skipped)')
    .eq('id', sessionId)
    .order('seq', { referencedTable: 'interview_turns' })
    .single()
  if (error || !session) throw new Error('Interview not found')

  const ctx = session.context as InterviewContext
  const skills = ctx.skills.map((s) => s.skill)
  const turns = (session.interview_turns as { seq: number; round: RoundId; question: string; answer: string | null; skipped: boolean }[])
    .filter((t) => t.answer !== null) // the last question may be unanswered if the interview was ended early

  // 1. Grade each answer on its own (low temperature = consistent grades).
  const questions: QuestionFeedback[] = []
  let model = ''
  for (const t of turns) {
    const reply = await chat(gradeMessages(ctx, t.question, t.round, t.skipped ? null : t.answer), { temperature: 0.2, maxTokens: 450, task: 'report' })
    model = `${reply.provider}/${reply.model}`
    const g = parseGrade(reply.text, skills)
    questions.push({ seq: t.seq, round: t.round, question: t.question, skipped: t.skipped, ...g, score: t.skipped ? 0 : g.score })
  }

  // 2. One summary built from the grades (not from the raw answers).
  const parsed = questions.length
    ? parseSummary((await chat(summaryMessages(ctx, questions), { temperature: 0.3, maxTokens: ctx.company ? 750 : 500, task: 'report' })).text)
    : { summary: 'No questions were answered in this interview.', strengths: [], improvements: [], studyNext: [], companyFit: '', companyTips: [] }
  const { companyFit, companyTips, ...summary } = parsed

  const scored = questions.filter((q) => q.score !== null)
  const report: Report = {
    overallScore: scored.length ? Math.round((scored.reduce((sum, q) => sum + q.score!, 0) / scored.length) * 10) : null,
    ...summary,
    questions,
    answeredCount: questions.filter((q) => !q.skipped).length,
    skippedCount: questions.filter((q) => q.skipped).length,
    generatedWith: model,
    ...(ctx.company && companyFit ? { companyFit: { company: ctx.company.name, verdict: companyFit, tips: companyTips } } : {}),
  }

  await db.from('interview_reports')
    .update({ status: 'ready', report, error: null, updated_at: new Date().toISOString() })
    .eq('session_id', sessionId)

  await updateProvenSkills(session.user_id, questions)
}

// Fill in the "Proven" column of the student's skills from this interview's technical questions.
async function updateProvenSkills(userId: string, questions: QuestionFeedback[]) {
  const bySkill = new Map<string, number[]>()
  for (const q of questions) {
    if (!q.skill || q.score === null || !SKILL_ROUNDS.includes(q.round)) continue
    bySkill.set(q.skill, [...(bySkill.get(q.skill) ?? []), q.score])
  }
  for (const [skill, scores] of bySkill) {
    const proven = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) // 0..100
    await supabase!.from('user_skills').update({ proven_score: proven }).eq('user_id', userId).eq('skill', skill)
  }
}
