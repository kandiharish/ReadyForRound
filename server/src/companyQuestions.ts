import { z } from 'zod'
import { catalog } from './catalog.js'
import { companyById } from './companies.js'
import { supabase } from './db/supabase.js'
import { chat, LlmUnavailableError } from './llm/client.js'

const questionSchema = z.object({
  round: z.string(),
  question: z.string().min(5).max(400),
  topic: z.string().max(60).default(''),
  tip: z.string().max(300).default(''),
  answer: z.string().max(1500).default(''),
})
const bankSchema = z.object({ questions: z.array(questionSchema).min(4).max(30) })
export type PracticeQuestion = z.infer<typeof questionSchema>

export class BankError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

const inFlight = new Map<string, Promise<PracticeQuestion[]>>() // one generation per company+role at a time

// Practice questions for a company and role: from the shared cache, or generated once and saved.
export async function getPracticeQuestions(companyId: string, roleId: string) {
  const company = companyById(companyId)
  const role = catalog.roles.find((r) => r.id === roleId)
  if (!company || !role || !company.roles.includes(roleId)) throw new BankError(404, 'No practice questions for that company and role')

  const { data } = await supabase!.from('company_questions').select('questions').eq('company_id', companyId).eq('role_id', roleId).maybeSingle()
  if (data) return data.questions as PracticeQuestion[]

  const key = `${companyId}:${roleId}`
  if (!inFlight.has(key)) {
    inFlight.set(key, generate(companyId, roleId).finally(() => inFlight.delete(key)))
  }
  return inFlight.get(key)!
}

async function generate(companyId: string, roleId: string) {
  const company = companyById(companyId)!
  const role = catalog.roles.find((r) => r.id === roleId)!
  const rounds = company.rounds.map((r) => `- "${r.id}" (${r.label}): ${r.focus}`).join('\n')
  const system = [
    `You write realistic PRACTICE interview questions in the style of ${company.name}'s publicly reported hiring process, for the role ${role.label}, aimed at freshers and early-career candidates.`,
    `${company.name} style: ${company.style}`,
    'Rounds:',
    rounds,
    '',
    'Rules:',
    '- Write 4 questions for each round listed above, typical of what candidates report, but do NOT claim they are real or leaked questions.',
    '- Make them specific and varied (no duplicates), suitable for answering out loud in 2 to 3 minutes.',
    '- For each: a short practice topic (2 to 5 words), one tip on what the interviewer is looking for, and a strong model answer in 3 to 6 sentences.',
    '- Model answers must be technically correct and use standard best practice. For behavioural questions, show a short STAR-style example.',
    'Reply with JSON only: {"questions":[{"round":"<round id>","question":"...","topic":"...","tip":"...","answer":"..."}]}',
  ].join('\n')

  let reply
  try {
    reply = await chat([{ role: 'system', content: system }, { role: 'user', content: `Company: ${company.name}. Role: ${role.label}.` }],
      { task: 'report', json: true, temperature: 0.5, maxTokens: 6000 })
  } catch (err) {
    if (err instanceof LlmUnavailableError) throw new BankError(503, 'The AI is busy right now. Please try again in a minute.')
    throw err
  }
  let questions: PracticeQuestion[]
  try {
    const valid = new Set(company.rounds.map((r) => r.id as string))
    questions = bankSchema.parse(JSON.parse(reply.text)).questions.filter((q) => valid.has(q.round))
  } catch {
    throw new BankError(502, "We couldn't prepare the questions this time. Please try again.")
  }
  if (questions.length < 4) throw new BankError(502, "We couldn't prepare the questions this time. Please try again.")

  await supabase!.from('company_questions').upsert({
    company_id: companyId, role_id: roleId, questions, generated_with: `${reply.provider}/${reply.model}`,
  })
  return questions
}
