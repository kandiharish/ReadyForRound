import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { useAuth } from '../auth/AuthProvider'
import { apiFetch } from '../lib/api'
import { useFeedback } from './Feedback'
import { Icon, type IconName } from './ui'

type Kind = 'idea' | 'problem' | 'question'
const KINDS: { id: Kind; label: string; icon: IconName; tint: string; placeholder: string }[] = [
  { id: 'idea', label: 'Idea', icon: 'bolt', tint: 'bg-lavender text-lavender-ink', placeholder: 'What would make ReadyForRound more useful for you?' },
  { id: 'problem', label: 'Problem', icon: 'alert', tint: 'bg-blush text-blush-ink', placeholder: 'What went wrong? What were you trying to do?' },
  { id: 'question', label: 'Question', icon: 'book', tint: 'bg-sky text-sky-ink', placeholder: 'Ask us anything.' },
]

const OPEN_EVENT = 'rfr-open-feedback'
export const openFeedback = () => window.dispatchEvent(new Event(OPEN_EVENT))

// Hidden on screens where a floating button would get in the way.
const HIDE_ON = [/^\/interview\/[^/]+$/, /^\/onboarding$/]

// A small floating "Feedback" button on every page. Messages are saved and emailed to the team's inbox.
export function FeedbackButton() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  // Other buttons (like "Ask us anything" in the FAQ) can open this form with openFeedback().
  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(OPEN_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_EVENT, onOpen)
  }, [])
  if (HIDE_ON.some((r) => r.test(pathname))) return null
  const inShell = !['/', '/login', '/signup', '/privacy', '/terms', '/status'].includes(pathname)
  // Phones: inside the app the top bar has a feedback icon, and on login/sign-up the button would cover the form.
  const phoneHidden = inShell || ['/login', '/signup'].includes(pathname)

  return (
    <>
      {/* A black floating button in the bottom-right corner. Inside the app it is a small round icon that
          slides open on hover, so it covers as little of the page as possible. On phones inside the app,
          the top bar has a feedback icon instead. */}
      <button type="button" onClick={() => setOpen(true)} aria-label="Send feedback"
        className={`${phoneHidden ? 'max-lg:hidden' : ''} group fixed right-5 z-30 inline-flex items-center rounded-full bg-ink text-paper h-11 text-sm font-semibold shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all ${
          inShell ? 'bottom-5 w-11 justify-center hover:w-auto hover:pl-3.5 hover:pr-4 hover:gap-2 focus-visible:w-auto focus-visible:pl-3.5 focus-visible:pr-4 focus-visible:gap-2' : 'bottom-5 gap-2 pl-3.5 pr-4'}`}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
        </svg>
        <span className={inShell ? 'hidden group-hover:inline group-focus-visible:inline whitespace-nowrap' : 'max-sm:sr-only'}>Feedback</span>
      </button>
      {open && <FeedbackDialog page={pathname} onClose={() => setOpen(false)} />}
    </>
  )
}

function FeedbackDialog({ page, onClose }: { page: string; onClose: () => void }) {
  const { session } = useAuth()
  const { toast } = useFeedback()
  const [kind, setKind] = useState<Kind>('idea')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState(session?.user.email ?? '')
  const [website, setWebsite] = useState('') // honeypot: stays empty for real people
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const current = KINDS.find((k) => k.id === kind)!

  useEffect(() => {
    textRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      await apiFetch('/feedback', { method: 'POST', body: JSON.stringify({ kind, message, email, page, website }) })
      toast('Thank you! We read every message.', 'success')
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-[#0b1020]/50 backdrop-blur-sm" />
      <form onSubmit={send} role="dialog" aria-modal="true" aria-labelledby="feedback-title"
        className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-card border border-line p-6 shadow-2xl animate-[toast-in_0.2s_ease-out] max-h-[92vh] overflow-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="feedback-title" className="font-display font-semibold text-3xl">Help us improve</h2>
            <p className="text-sm text-muted mt-1">Share an idea, report a problem or ask a question. It goes straight to our team.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="w-9 h-9 shrink-0 rounded-full hover:bg-raised flex items-center justify-center text-muted">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>

        <div role="radiogroup" aria-label="What is it about?" className="grid grid-cols-3 gap-2 mt-5">
          {KINDS.map((k) => (
            <button key={k.id} type="button" role="radio" aria-checked={kind === k.id} onClick={() => setKind(k.id)}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-sm font-medium transition-all ${kind === k.id ? 'border-accent bg-accent-soft text-ink shadow-sm' : 'border-line text-soft hover:border-line-strong'}`}>
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${k.tint}`}><Icon name={k.icon} size={17} /></span>
              {k.label}
            </button>
          ))}
        </div>

        <label className="block mt-5 text-sm font-medium text-soft" htmlFor="fb-message">Your message</label>
        <textarea id="fb-message" ref={textRef} value={message} onChange={(e) => setMessage(e.target.value)} required minLength={5} maxLength={2000} rows={5}
          placeholder={current.placeholder}
          className="mt-2 w-full rounded-xl bg-raised border border-line-strong px-3.5 py-3 text-ink focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-y" />
        <p className="text-xs text-muted text-right mt-1">{message.length}/2000</p>

        <label className="block mt-2 text-sm font-medium text-soft" htmlFor="fb-email">Email <span className="font-normal text-muted">(optional, so we can reply)</span></label>
        <input id="fb-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} placeholder="you@example.com"
          className="mt-2 w-full min-h-11 rounded-xl bg-raised border border-line-strong px-3.5 text-ink focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />

        {/* Honeypot: invisible to people; spam bots fill every field, so a filled one means "bot" */}
        <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} className="hidden" aria-hidden="true" />

        {error && <p className="text-sm text-bad mt-3" role="alert">{error}</p>}

        <button type="submit" disabled={sending || message.trim().length < 5}
          className="mt-5 w-full min-h-12 rounded-xl bg-accent text-on-accent font-semibold hover:bg-accent-hover disabled:opacity-50 inline-flex items-center justify-center gap-2">
          {sending ? 'Sending…' : <>Send <Icon name="arrow" size={17} /></>}
        </button>
      </form>
    </div>
  )
}
