import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Icon } from './ui'
import { WordReveal } from './LandingMotion'

// First visit after signing up: a short welcome, then an optional tour where a spotlight glides between
// real parts of the app. Shown once per account on this device; Settings can replay it.

const KEY = (userId: string) => `rfr-tour-done:${userId}`
const REPLAY_EVENT = 'rfr-replay-tour'

export function replayTour(userId: string) {
  try { localStorage.removeItem(KEY(userId)) } catch { /* private mode: it simply shows again */ }
  window.dispatchEvent(new Event(REPLAY_EVENT))
}

const STEPS: { target: string; title: string; text: string }[] = [
  { target: 'goal,goals', title: 'Your goal', text: 'Questions, tips and job data are all shaped for the role and company type you picked. Change it any time here.' },
  { target: 'next', title: 'Start here', text: 'We suggest what to practise next, based on your reports. One tap starts it.' },
  { target: 'practice', title: 'Practice', text: 'Full mock interviews, single rounds, 5-minute drills and group discussions with AI classmates.' },
  { target: 'readiness', title: 'Your readiness', text: 'After each interview this shows how ready you are for your goal, round by round. Watch it grow.' },
  { target: 'market', title: 'Jobs Board', text: 'Real openings, pay and the skills employers ask for, read from live job ads every day.' },
  { target: 'resume', title: 'Resume Studio', text: 'See your ATS score, what to fix, and how well your projects fit the role before you apply.' },
]

type Rect = { top: number; left: number; width: number; height: number }
const PAD = 8
const CARD_W = 330

// The first element for this tour step that is actually visible. Desktop and phone layouts differ,
// so a step can name several targets ("goal" is the sidebar card on desktop, the Goals tab on phones).
function findTarget(ids: string) {
  return [...document.querySelectorAll<HTMLElement>(ids.split(',').map((id) => `[data-tour="${id}"]`).join(','))].find((el) => {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0
  }) ?? null
}

export function WelcomeTour({ userId, firstName }: { userId: string; firstName: string }) {
  const [phase, setPhase] = useState<'welcome' | 'tour' | 'done'>(() => {
    try { return localStorage.getItem(KEY(userId)) ? 'done' : 'welcome' } catch { return 'done' }
  })
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const nextBtn = useRef<HTMLButtonElement>(null)

  const finish = useCallback(() => {
    try { localStorage.setItem(KEY(userId), new Date().toISOString()) } catch { /* fine */ }
    setPhase('done')
  }, [userId])

  // Settings → "Replay the tour"
  useEffect(() => {
    const again = () => { setStep(0); setPhase('welcome') }
    window.addEventListener(REPLAY_EVENT, again)
    return () => window.removeEventListener(REPLAY_EVENT, again)
  }, [])

  // Bring the step's target into view, then measure it; keep measuring while the page scrolls or resizes
  useLayoutEffect(() => {
    if (phase !== 'tour') return
    const el = findTarget(STEPS[step].target)
    if (!el) { setRect(null); return }
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    const measure = () => {
      const r = el.getBoundingClientRect()
      setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 })
    }
    measure()
    const settle = setTimeout(measure, 450)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => { clearTimeout(settle); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true) }
  }, [phase, step])

  // Keyboard: arrows move between steps, Escape closes
  useEffect(() => {
    if (phase === 'done') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish()
      if (phase !== 'tour') return
      if (e.key === 'ArrowRight') setStep((s) => (s < STEPS.length - 1 ? s + 1 : s))
      if (e.key === 'ArrowLeft') setStep((s) => Math.max(0, s - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, finish])

  useEffect(() => { if (phase === 'tour') nextBtn.current?.focus({ preventScroll: true }) }, [phase, step])

  if (phase === 'done') return null

  if (phase === 'welcome') {
    return (
      <div className="fixed inset-0 z-70 grid place-items-center p-4 bg-[#0b1220]/60 backdrop-blur-[2px] animate-[toast-in_0.3s_ease-out] motion-reduce:animate-none">
        <div role="dialog" aria-modal="true" aria-labelledby="welcome-title"
          className="w-full max-w-md rounded-2xl bg-card border border-line shadow-2xl p-8 text-center animate-[pop-in_0.5s_cubic-bezier(0.22,1,0.36,1)] motion-reduce:animate-none">
          <img src="/logo-mark.png" alt="" className="w-14 h-14 mx-auto animate-[pop-in_0.7s_cubic-bezier(0.22,1,0.36,1)_0.1s_both] motion-reduce:animate-none" />
          <h2 id="welcome-title" className="font-display font-semibold text-[1.75rem] leading-tight mt-5">
            <WordReveal delay={250} lines={[firstName ? ['Welcome,', `${firstName}.`] : ['Welcome', 'aboard.']]} />
          </h2>
          <p className="text-soft mt-3 animate-[toast-in_0.5s_ease-out_0.55s_both] motion-reduce:animate-none">
            Your prep space is ready. Want a quick look around? It takes about 30 seconds.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-2 justify-center animate-[toast-in_0.5s_ease-out_0.7s_both] motion-reduce:animate-none">
            <button type="button" autoFocus onClick={() => { setStep(0); setPhase('tour') }}
              className="inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-lg bg-accent text-on-accent font-semibold hover:bg-accent-hover">
              Show me around <Icon name="arrow" size={16} />
            </button>
            <button type="button" onClick={finish} className="min-h-11 px-5 rounded-lg text-muted hover:text-ink hover:bg-raised font-medium">Skip for now</button>
          </div>
        </div>
      </div>
    )
  }

  const s = STEPS[step]
  const last = step === STEPS.length - 1
  const vw = window.innerWidth, vh = window.innerHeight
  // Place the card beside the spotlight: right if it fits, else left, else below or above; never off-screen
  let cardStyle: React.CSSProperties
  if (!rect) {
    cardStyle = { top: vh / 2 - 110, left: Math.max(16, vw / 2 - CARD_W / 2) }
  } else if (rect.left + rect.width + 16 + CARD_W < vw - 16) {
    cardStyle = { top: Math.min(Math.max(16, rect.top), vh - 240), left: rect.left + rect.width + 16 }
  } else if (rect.left - 16 - CARD_W > 16) {
    cardStyle = { top: Math.min(Math.max(16, rect.top), vh - 240), left: rect.left - 16 - CARD_W }
  } else {
    const below = rect.top + rect.height + 16
    cardStyle = { top: below + 220 < vh ? below : Math.max(16, rect.top - 236), left: Math.min(Math.max(16, rect.left), vw - CARD_W - 16) }
  }

  return (
    <div className="fixed inset-0 z-70" aria-live="polite">
      {/* The spotlight: a clear window over the target, everything else dimmed. It glides between steps. */}
      <div aria-hidden="true" className="fixed rounded-xl ring-2 ring-accent transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none pointer-events-none"
        style={rect
          ? { ...rect, boxShadow: '0 0 0 9999px rgba(11,18,32,0.62)' }
          : { top: vh / 2, left: vw / 2, width: 0, height: 0, boxShadow: '0 0 0 9999px rgba(11,18,32,0.62)' }} />

      <div role="dialog" aria-modal="true" aria-labelledby="tour-title"
        className="fixed rounded-xl bg-card border border-line shadow-2xl p-5 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{ ...cardStyle, width: Math.min(CARD_W, vw - 32) }}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-accent-deep">Step {step + 1} of {STEPS.length}</span>
          <button type="button" onClick={finish} className="text-xs text-muted hover:text-ink">Skip tour</button>
        </div>
        <div key={step} className="animate-[toast-in_0.35s_ease-out] motion-reduce:animate-none">
          <h3 id="tour-title" className="font-semibold text-lg mt-2">{s.title}</h3>
          <p className="text-sm text-soft mt-1.5 leading-relaxed">{s.text}</p>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="flex gap-1" aria-hidden="true">
            {STEPS.map((x, i) => <span key={x.target} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-5 bg-accent' : 'w-1.5 bg-line-strong'}`} />)}
          </span>
          <span className="flex gap-2">
            {step > 0 && <button type="button" onClick={() => setStep(step - 1)} className="min-h-9 px-3 rounded-lg text-sm font-medium text-soft hover:bg-raised">Back</button>}
            <button type="button" ref={nextBtn} onClick={() => (last ? finish() : setStep(step + 1))}
              className="min-h-9 px-4 rounded-lg text-sm font-semibold bg-accent text-on-accent hover:bg-accent-hover">
              {last ? 'Done' : 'Next'}
            </button>
          </span>
        </div>
      </div>
    </div>
  )
}
