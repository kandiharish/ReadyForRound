import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router'
import { useAuth } from '../auth/AuthProvider'
import { Avatar, type AvatarState } from '../components/Avatar'
import { Brand } from '../components/Brand'
import { Reveal } from '../components/Reveal'
import { ProductVideo, ScrollProgress, StatsStrip, Tour, WordReveal } from '../components/LandingMotion'
import { ThemeToggle } from '../components/ThemeToggle'
import { openFeedback } from '../components/FeedbackButton'
import { Icon } from '../components/ui'
import { usePageTitle } from '../lib/pageTitle'

// The public front page. Visitors skim, so it's built from pictures, motion and short lines, not paragraphs.
// Logged-in users skip straight to their Home.
export default function Landing() {
  usePageTitle()
  const { session, loading } = useAuth()

  if (!loading && session) return <Navigate to="/home" replace />

  return (
    <div className="min-h-screen bg-paper text-ink overflow-x-clip">
      <TopNav />
      <main>
        <Hero />
        <ProductVideo />
        <StatsStrip />
        <Tour />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}

/* ---------- Building blocks ---------- */

const GRADIENT_TEXT = 'text-accent'

function CtaButtons({ center = false }: { center?: boolean }) {
  return (
    <div className={`flex flex-wrap gap-3 ${center ? 'justify-center' : ''}`}>
      <Link to="/signup" className="group inline-flex items-center gap-2 min-h-12 px-6 rounded-lg bg-accent text-on-accent font-semibold hover:bg-accent-hover transition-colors">
        Start practising free <Icon name="arrow" size={18} className="group-hover:translate-x-1 transition-transform" />
      </Link>
      <Link to="/login" className="inline-flex items-center min-h-12 px-6 rounded-lg border border-line-strong bg-card font-medium hover:bg-raised transition-colors">
        Log in
      </Link>
    </div>
  )
}

/* ---------- Sections ---------- */

function TopNav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <header className={`relative sticky top-0 z-40 transition-all duration-300 border-b ${scrolled ? 'bg-paper/80 backdrop-blur-md border-line shadow-sm' : 'bg-transparent border-transparent'}`}>
      <div className="max-w-7xl 2xl:max-w-[104rem] mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
        <Link to="/" aria-label="ReadyForRound home"><Brand /></Link>
        <nav aria-label="Sections" className="hidden md:flex items-center gap-7 text-sm text-soft">
          {[['#video', 'Watch'], ['#tour', 'Features'], ['#faq', 'FAQ']].map(([href, label]) => (
            <a key={href} href={href} className="relative hover:text-ink after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-full after:bg-accent after:scale-x-0 hover:after:scale-x-100 after:origin-left after:transition-transform">{label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login" className="hidden sm:inline-flex items-center min-h-10 px-4 rounded-xl text-sm font-medium hover:bg-raised">Log in</Link>
          <Link to="/signup" className="inline-flex items-center min-h-10 px-4 rounded-xl bg-accent text-on-accent text-sm font-semibold hover:bg-accent-hover">Start free</Link>
        </div>
      </div>
      <ScrollProgress />
    </header>
  )
}


function Hero() {
  return (
    <section className="relative px-4 sm:px-6 pt-10 sm:pt-16 pb-24">
      <div className="relative max-w-7xl 2xl:max-w-[104rem] mx-auto grid gap-14 lg:grid-cols-[1.05fr_1fr] items-center">
        <div>
          <h1 className="font-display font-semibold text-[2.6rem] sm:text-6xl lg:text-[3.6rem] xl:text-[4.3rem] 2xl:text-[5rem] leading-[1.05]">
            <WordReveal delay={120} lines={[
              ['Walk', 'into', 'your'],
              [<span className={GRADIENT_TEXT}>placement</span>, 'interview', 'like'],
              ["you've", 'already', 'done', 'it.'],
            ]} />
          </h1>
          <Reveal delay={650}>
            <p className="text-lg sm:text-xl text-soft mt-6 max-w-lg">
              The AI mock interview platform: practise by voice, get honest feedback, and know exactly what to study next.
            </p>
          </Reveal>
          <Reveal delay={800} className="mt-8"><CtaButtons /></Reveal>
          <Reveal delay={950}>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              {['Free for every student', 'No credit card', 'Camera optional'].map((t) => (
                <li key={t} className="flex items-center gap-1.5"><Icon name="check" size={15} className="text-muted" />{t}</li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal from="right" delay={500}><HeroDemo /></Reveal>
      </div>
    </section>
  )
}

const DEMO = [
  { round: 'Technical round', question: 'When would you use a LEFT JOIN instead of an INNER JOIN?', score: 72, good: 'Clear example with tables', next: 'GROUP BY with HAVING' },
  { round: 'HR round', question: 'Tell me about a time you worked in a team under pressure.', score: 81, good: 'Great STAR structure', next: 'Say what YOU did, not "we"' },
  { round: 'Project round', question: 'Why did you choose React for your final-year project?', score: 66, good: 'Honest about trade-offs', next: 'Explain state management' },
]
type Phase = 'asking' | 'answering' | 'feedback'

// A tiny looping demo of the app: the question types itself out, the candidate answers, then feedback pops in.
function HeroDemo() {
  const [n, setN] = useState(0)
  const [phase, setPhase] = useState<Phase>('asking')
  const [typed, setTyped] = useState(0)
  const item = DEMO[n]

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    if (phase === 'asking') {
      t = typed < item.question.length
        ? setTimeout(() => setTyped((c) => c + 1), 28)
        : setTimeout(() => setPhase('answering'), 700)
    } else if (phase === 'answering') {
      t = setTimeout(() => setPhase('feedback'), 2600)
    } else {
      t = setTimeout(() => { setN((x) => (x + 1) % DEMO.length); setTyped(0); setPhase('asking') }, 3400)
    }
    return () => clearTimeout(t)
  }, [phase, typed, item.question.length])

  const avatar: AvatarState = phase === 'asking' ? 'speaking' : phase === 'answering' ? 'listening' : 'idle'

  return (
    <div className="relative mx-auto w-full max-w-lg xl:max-w-xl 2xl:max-w-2xl mb-20 sm:mb-12" aria-label="A short animated example of an interview on ReadyForRound">
      <div className="rounded-3xl bg-stage-card border border-stage-line shadow-lg shadow-black/5 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-stage-line text-xs text-stage-muted">
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-bad animate-pulse" /> {item.round}</span>
          <span className="flex gap-1">{DEMO.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === n ? 'w-5 bg-accent' : 'w-1.5 bg-stage-line'}`} />)}</span>
        </div>
        <div className="bg-stage px-6 pt-8 pb-6 flex flex-col items-center">
          <div className={`w-36 h-36 rounded-full overflow-hidden transition-shadow duration-500 ${phase === 'asking' ? 'shadow-[0_0_0_6px_rgba(var(--glow-rgb),0.4),0_0_60px_rgba(var(--glow-rgb),0.3)]' : 'shadow-[0_0_0_3px_rgba(var(--glow-rgb),0.15)]'}`}>
            <Avatar who="priya" state={avatar} />
          </div>
          <div className="mt-5 w-full h-28 sm:h-24 overflow-hidden rounded-2xl bg-stage-card border border-stage-line px-4 py-3">
            <p className="font-display text-xl leading-snug text-stage-text">
              {item.question.slice(0, typed)}
              {phase === 'asking' && <span className="inline-block w-0.5 h-5 bg-accent align-middle ml-0.5 animate-[caret_1s_steps(1)_infinite]" />}
            </p>
          </div>
          <div className="mt-5 h-10 flex items-center">
            {phase === 'answering' ? (
              <span className="inline-flex items-center gap-3 rounded-full bg-blush text-blush-ink px-4 py-2 text-sm font-semibold motion-safe:animate-[pop-in_0.3s_ease-out]">
                <span className="w-2.5 h-2.5 rounded-full bg-bad animate-pulse" /> You're answering
                <span className="flex items-end gap-0.5 h-4" aria-hidden="true">
                  {[0, 1, 2, 3, 4, 5].map((i) => <span key={i} className="w-0.75 rounded-full bg-current motion-safe:animate-[voice-bar_0.8s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.1}s`, height: '40%' }} />)}
                </span>
              </span>
            ) : (
              <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${phase === 'asking' ? 'bg-stage-raised text-stage-muted' : 'bg-accent text-on-accent'}`}>
                <Icon name="mic" size={15} /> {phase === 'asking' ? 'Interviewer is asking…' : 'Answer sent'}
              </span>
            )}
          </div>
        </div>
      </div>

      {phase === 'feedback' && (
        <div key={n} className="absolute -right-2 sm:-right-12 -bottom-20 w-60 rounded-2xl bg-card border border-line shadow-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Your feedback</span>
            <span className="text-xs text-muted">Example</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <CountUp to={item.score} className="font-display font-semibold text-4xl text-good" />
            <span className="text-sm text-muted">/ 100</span>
          </div>
          <p className="text-xs text-sage-ink bg-sage rounded-lg px-2 py-1.5 mt-2">✓ {item.good}</p>
          <p className="text-xs text-peach-ink bg-peach rounded-lg px-2 py-1.5 mt-1.5">→ Next: {item.next}</p>
        </div>
      )}

    </div>
  )
}

// A number that counts up from 0 (used for scores).
function CountUp({ to, className = '', duration = 900 }: { to: number; className?: string; duration?: number }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      setV(Math.round(to * (1 - Math.pow(1 - p, 3)))) // ease-out: fast at first, then settles
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, duration])
  return <span className={className}>{v}</span>
}


const FAQS = [
  { q: 'Is it really free?', a: 'Yes, 100% free. A small daily limit (5 interviews and 10 drills) keeps it running smoothly, and it resets at midnight.' },
  { q: 'Who is it for?', a: 'Anyone with an interview coming up: college students, freshers, working professionals and experienced people switching jobs. Questions adjust to your experience level.' },
  { q: 'Which roles can I practise for?', a: '19 roles. Software: SDE, Frontend, Backend, Full-Stack, Forward Deployed Engineer, Mobile and QA. Data and AI: AI / ML Engineer, Data Scientist, Data Engineer and Data Analyst. Cloud and security: DevOps / Cloud and Cybersecurity. Core engineering for ECE, EEE and IT: VLSI Design, VLSI Verification, Embedded Systems, Electrical, Network and PCB Design. Upload your resume and the interviewer also asks about your own projects.' },
  { q: "I don't know which role suits me. Can it help?", a: 'Yes. Career Compass is a 10-minute assessment of the work you enjoy, what you have actually tried and what you are comfortable with. Role names stay hidden until the end, so the result reflects you, not hype. You get your top 3 roles with reasons, and honest notes on roles that may not fit.' },
  { q: 'Can I practise for a specific company?', a: 'Yes. Pick from 19 companies, from TCS, Infosys, Zoho, Amazon and Google to core engineering companies like Qualcomm, Intel, Bosch and Cisco, and practise in the style of their publicly reported interviews, with practice questions for each role. ReadyForRound is not affiliated with these companies.' },
  { q: 'Do I need a camera?', a: 'No. The camera is optional and never recorded. You can even type your answers instead of speaking.' },
  { q: 'Is it like a real interview?', a: 'The interviewer speaks every question, listens to your answer and asks follow-ups when you are vague, just like a real one.' },
  { q: 'How accurate is the feedback?', a: 'It is AI feedback: a very useful guide, but it can make mistakes. Use it to find gaps and double-check facts as you study.' },
  { q: 'Does it work on my phone?', a: 'Yes, in any modern browser. Chrome or Edge on a laptop gives the best voice experience.' },
]

// Left: a short intro and a way to ask us directly. Right: one list of questions where only one answer
// is open at a time, and it slides open smoothly (so nothing next to it jumps around).
function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" className="px-4 sm:px-6 lg:px-10 py-20 sm:py-28 scroll-mt-16">
      <div className="max-w-7xl 2xl:max-w-[104rem] mx-auto grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 items-start">
        <Reveal className="lg:sticky lg:top-24">
          <h2 className="font-display font-semibold text-3xl sm:text-4xl leading-tight">Questions</h2>
          <p className="text-soft mt-3 max-w-sm">
            Something else on your mind?{' '}
            <button type="button" onClick={openFeedback} className="text-accent-deep font-medium hover:underline">Send us a message</button>. We read every one.
          </p>
        </Reveal>

        <ul className="divide-y divide-line border-y border-line">
          {FAQS.map((f, i) => {
            const isOpen = open === i
            return (
              <li key={f.q}>
                <Reveal delay={i * 60}>
                  <button type="button" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} aria-controls={`faq-${i}`}
                    className="group w-full flex items-center gap-5 py-5 text-left">
                    <span className="flex-1 text-[17px] font-medium text-ink">{f.q}</span>
                    <span className={`shrink-0 text-muted transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>
                      <Icon name="plus" size={18} />
                    </span>
                  </button>
                  {/* grid-rows 0fr -> 1fr animates the answer's height smoothly */}
                  <div id={`faq-${i}`} role="region" className={`grid transition-[grid-template-rows,opacity] duration-400 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <p className="text-soft leading-relaxed pr-12 pb-5">{f.a}</p>
                    </div>
                  </div>
                </Reveal>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

// Closing call to action: message on the left, buttons on the right.
function FinalCta() {
  return (
    <section className="px-4 sm:px-6 lg:px-10 pb-20">
      <Reveal>
        <div className="relative max-w-6xl mx-auto overflow-hidden rounded-2xl bg-[#0b1220] px-6 py-10 sm:px-12 sm:py-12">
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="text-white">
              <h2 className="font-display font-semibold text-3xl sm:text-4xl leading-tight">Your next interview is<br className="hidden sm:block" /> a practice round away.</h2>
              <p className="text-white/80 mt-3">Start your first mock interview in under a minute.</p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Link to="/signup" className="group inline-flex items-center gap-2 min-h-12 px-6 rounded-lg bg-white text-[#0b63e5] font-semibold hover:bg-white/90 transition-colors">
                Start practising free <Icon name="arrow" size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/login" className="inline-flex items-center min-h-12 px-6 rounded-lg border border-white/40 text-white font-medium hover:bg-white/10 transition-colors">
                Log in
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

function Footer() {
  const contact = import.meta.env.VITE_CONTACT_EMAIL as string | undefined
  return (
    <footer className="border-t border-line px-4 sm:px-6 pt-10 pb-24">
      <div className="max-w-7xl 2xl:max-w-[104rem] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="max-w-md text-center sm:text-left">
          <Brand size="sm" />
          <p className="text-xs text-muted mt-3 leading-relaxed">
            ReadyForRound (Ready For Round) is a 100% free AI mock interview platform for interview practice:
            technical, HR, project and behavioural rounds with instant feedback.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-6 text-sm text-muted">
          <Link to="/privacy" className="hover:text-ink">Privacy</Link>
          <Link to="/terms" className="hover:text-ink">Terms</Link>
          {contact && <a href={`mailto:${contact}`} className="hover:text-ink">Contact</a>}
          <span>© {new Date().getFullYear()} ReadyForRound</span>
        </nav>
      </div>
    </footer>
  )
}
