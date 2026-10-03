import { z } from 'zod'
import { config } from './config.js'
import { supabase } from './db/supabase.js'
import { logError } from './errors.js'

export const feedbackSchema = z.object({
  kind: z.enum(['idea', 'problem', 'question', 'other']),
  message: z.string().trim().min(5, 'Please write a little more (at least 5 characters).').max(2000),
  email: z.union([z.string().trim().email('That email address looks wrong.').max(200), z.literal('')]).optional(),
  page: z.string().max(300).optional(),
  website: z.string().optional(), // "honeypot": hidden from people, bots fill it in
})

const KIND_LABEL = { idea: 'Idea', problem: 'Problem', question: 'Question', other: 'Other' } as const

// Save the message, then email a copy to the owner's inbox. Saving comes first, so nothing is lost if email fails.
export async function submitFeedback(input: z.infer<typeof feedbackSchema>, meta: { userId?: string; userAgent?: string }) {
  const email = input.email || null
  let id: number | null = null
  if (supabase) {
    const { data, error } = await supabase.from('feedback')
      .insert({ kind: input.kind, message: input.message, email, page: input.page, user_id: meta.userId ?? null, user_agent: meta.userAgent })
      .select('id').single()
    if (error) throw error
    id = data.id
  }

  const emailed = await sendEmail(input, email, meta.userId)
  if (emailed && id !== null && supabase) await supabase.from('feedback').update({ emailed: true }).eq('id', id)
}

// Resend (resend.com) sends the email. Without your own domain, Resend only delivers to your own account's
// email address, which is exactly what we want: feedback goes to your inbox.
async function sendEmail(input: z.infer<typeof feedbackSchema>, email: string | null, userId?: string) {
  if (!config.RESEND_API_KEY || !config.FEEDBACK_TO_EMAIL) return false
  const text = [
    `New ${KIND_LABEL[input.kind].toLowerCase()} from ReadyForRound`,
    '',
    input.message,
    '',
    '---',
    `From: ${email ?? 'no email given'}${userId ? ` (logged-in user ${userId})` : ' (not logged in)'}`,
    `Page: ${input.page ?? 'unknown'}`,
    `Sent: ${new Date().toISOString()}`,
  ].join('\n')
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'ReadyForRound <onboarding@resend.dev>',
        to: [config.FEEDBACK_TO_EMAIL],
        ...(email ? { reply_to: email } : {}), // pressing "Reply" in your inbox answers the person directly
        subject: `[ReadyForRound] ${KIND_LABEL[input.kind]}: ${input.message.slice(0, 60)}${input.message.length > 60 ? '…' : ''}`,
        text,
      }),
    })
    if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`)
    return true
  } catch (err) {
    logError('server', err as Error, { path: '/api/feedback (email)' })
    return false
  }
}
