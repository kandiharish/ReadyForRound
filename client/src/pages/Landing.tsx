import { useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router'
import { useAuth } from '../auth/AuthProvider'
import { Avatar, type AvatarState } from '../components/Avatar'
import { Brand } from '../components/Brand'
import { Reveal, useInView } from '../components/Reveal'
import { ThemeToggle } from '../components/ThemeToggle'
import { Icon, type IconName } from '../components/ui'
import { usePageTitle } from '../lib/pageTitle'

// The public front page. Students skim, so it's built from pictures, motion and short lines, not paragraphs.
// Logged-in students skip straight to their Home.
export default function Landing() {
  usePageTitle()
  const { session, loading } = useAuth()

  if (!loading && session) return <Navigate to="/home" replace />

  return (
    <div className="min-h-screen bg-paper text-ink overflow-x-hidden">
      <TopNav />
      <main>
        <Hero />
        <TopicRibbon />
        <Problems />
        <HowItWorks />
        <Features />
        <FreeBanner />
        <SampleReport />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}

/* ---------- Building blocks ---------- */

const TINTS = {
  blush: 'bg-blush text-blush-ink',
  sage: 'bg-sage text-sage-ink',
  lavender: 'bg-lavender text-lavender-ink',
  peach: 'bg-peach text-peach-ink',
  sky: 'bg-sky text-sky-ink',
} as const
type Tint = keyof typeof TINTS

const GRADIENT_TEXT = 'bg-linear-to-r from-[#12a8f0] via-[#7b3cf0] to-[#12a8f0] bg-size-[200%_auto] bg-clip-text text-transparent motion-safe:animate-[shimmer_6s_linear_infinite]'

function Section({ id, eyebrow, title, children, className = '', center = false }: { id?: string; eyebrow: string; title: ReactNode; children: ReactNode; className?: string; center?: boolean }) {
  return (
    <section id={id} className={`px-4 sm:px-6 py-20 sm:py-28 scroll-mt-16 ${className}`}>
      <div className="max-w-6xl mx-auto">
        <Reveal className={center ? 'text-center max-w-2xl mx-auto' : 'max-w-2xl'}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
          <h2 className="font-display font-semibold text-4xl sm:text-5xl leading-[1.05] mt-3">{title}</h2>
        </Reveal>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  )
}

function Chip({ tint, icon, size = 'md' }: { tint: Tint; icon: IconName; size?: 'md' | 'lg' }) {
  return (
    <span className={`${size === 'lg' ? 'w-14 h-14 rounded-2xl' : 'w-10 h-10 rounded-xl'} shrink-0 flex items-center justify-center ${TINTS[tint]}`}>
      <Icon name={icon} size={size === 'lg' ? 26 : 18} />
    </span>
  )
}

function CtaButtons({ center = false }: { center?: boolean }) {
  return (
    <div className={`flex flex-wrap gap-3 ${center ? 'justify-center' : ''}`}>
      <Link to="/signup" className="group relative inline-flex items-center gap-2 min-h-12 px-6 rounded-xl bg-accent text-on-accent font-semibold shadow-lg shadow-accent/30 hover:bg-accent-hover hover:-translate-y-0.5 hover:shadow-xl transition-all overflow-hidden">
        {/* a light sweep across the button on hover */}
        <span aria-hidden="true" className="absolute inset-y-0 -left-1/2 w-1/3 bg-white/25 -skew-x-12 group-hover:translate-x-[450%] transition-transform duration-700" />
        Start practising free <Icon name="arrow" size={18} className="group-hover:translate-x-1 transition-transform" />
      </Link>
      <Link to="/login" className="inline-flex items-center min-h-12 px-6 rounded-xl border border-line-strong bg-card font-medium hover:bg-raised hover:-translate-y-0.5 transition-all">
        Log in
      </Link>
    </div>
  )
}

function FreeBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-sage text-sage-ink px-3.5 py-1.5 text-sm font-semibold">
      <span className="relative flex w-2 h-2">
        <span className="absolute inset-0 rounded-full bg-good opacity-60 motion-safe:animate-ping" />
        <span className="relative w-2 h-2 rounded-full bg-good" />
      </span>
      100% free for students
    </span>
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
    <header className={`sticky top-0 z-40 transition-all duration-300 border-b ${scrolled ? 'bg-paper/80 backdrop-blur-md border-line shadow-sm' : 'bg-transparent border-transparent'}`}>
      <div className="max-w-6xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
        <Link to="/" aria-label="ReadyForRound home"><Brand /></Link>
        <nav aria-label="Sections" className="hidden md:flex items-center gap-7 text-sm text-soft">
          {[['#problems', 'Why'], ['#how', 'How it works'], ['#features', 'Features'], ['#faq', 'FAQ']].map(([href, label]) => (
            <a key={href} href={href} className="relative hover:text-ink after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-full after:bg-accent after:scale-x-0 hover:after:scale-x-100 after:origin-left after:transition-transform">{label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login" className="hidden sm:inline-flex items-center min-h-10 px-4 rounded-xl text-sm font-medium hover:bg-raised">Log in</Link>
          <Link to="/signup" className="inline-flex items-center min-h-10 px-4 rounded-xl bg-accent text-on-accent text-sm font-semibold hover:bg-accent-hover">Start free</Link>
        </div>
      </div>
    </header>
  )
}

const ROTATING = ['placement', 'technical', 'HR', 'project']

// The word in the headline that changes every few seconds.
function RotatingWord() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % ROTATING.length), 2400)
    return () => clearInterval(t)
  }, [])
  return <span key={i} className={`inline-block ${GRADIENT_TEXT} motion-safe:animate-[pop-in_0.5s_ease-out]`}>{ROTATING[i]}</span>
}

function Hero() {
  return (
    <section className="relative px-4 sm:px-6 pt-10 sm:pt-16 pb-24">
      <div aria-hidden="true" className="pointer-events-none absolute -top-16 inset-x-0 bottom-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-md h-112 rounded-full bg-sky opacity-80 blur-3xl motion-safe:animate-[blob-drift_18s_ease-in-out_infinite]" />
        <div className="absolute top-10 -right-24 w-104 h-104 rounded-full bg-lavender opacity-80 blur-3xl motion-safe:animate-[blob-drift_22s_ease-in-out_infinite_reverse]" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-blush opacity-60 blur-3xl motion-safe:animate-[blob-drift_26s_ease-in-out_infinite]" />
      </div>

      <div className="relative max-w-6xl mx-auto grid gap-14 lg:grid-cols-[1.05fr_1fr] items-center">
        <div>
          <Reveal><FreeBadge /></Reveal>
          <Reveal delay={100}>
            {/* Fixed line breaks, so the changing word never makes the headline jump around */}
            <h1 className="font-display font-semibold text-[2.6rem] sm:text-6xl lg:text-[3.6rem] leading-[1.05] mt-6">
              <span className="block">Walk into your</span>
              <span className="block sm:whitespace-nowrap"><RotatingWord /> <span className="block sm:inline">interview like</span></span>
              <span className="block">you've already <span className="block sm:inline">done it.</span></span>
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-lg sm:text-xl text-soft mt-6 max-w-lg">
              Real mock interviews by voice. Honest feedback. A plan for what to study next.
            </p>
          </Reveal>
          <Reveal delay={300} className="mt-8"><CtaButtons /></Reveal>
          <Reveal delay={450}>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              {['No credit card', 'No hidden plans', 'Camera optional'].map((t) => (
                <li key={t} className="flex items-center gap-1.5"><Icon name="check" size={15} className="text-good" />{t}</li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal from="right" delay={200}><HeroDemo /></Reveal>
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

// A tiny looping demo of the app: the question types itself out, the student answers, then feedback pops in.
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
    <div className="relative mx-auto w-full max-w-lg mb-20 sm:mb-12" aria-label="A short animated example of an interview on ReadyForRound">
      <div className="rounded-3xl bg-stage-card border border-stage-line shadow-2xl shadow-accent/15 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-stage-line text-xs text-stage-muted">
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-bad animate-pulse" /> {item.round}</span>
          <span className="flex gap-1">{DEMO.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === n ? 'w-5 bg-accent' : 'w-1.5 bg-stage-line'}`} />)}</span>
        </div>
        <div className="bg-stage px-6 pt-8 pb-6 flex flex-col items-center">
          <div className={`w-36 h-36 rounded-full overflow-hidden transition-shadow duration-500 ${phase === 'asking' ? 'shadow-[0_0_0_6px_rgba(var(--glow-rgb),0.4),0_0_60px_rgba(var(--glow-rgb),0.3)]' : 'shadow-[0_0_0_3px_rgba(var(--glow-rgb),0.15)]'}`}>
            <Avatar who="priya" state={avatar} />
          </div>
          <div className="mt-5 w-full min-h-22 rounded-2xl bg-stage-card border border-stage-line px-4 py-3">
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
        <div key={n} className="absolute -right-2 sm:-right-12 -bottom-20 w-60 rounded-2xl bg-card border border-line shadow-2xl p-4 motion-safe:animate-[pop-in_0.45s_cubic-bezier(0.22,1,0.36,1)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Your feedback</span>
            <span className="text-[10px] uppercase tracking-wider text-muted">Example</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <CountUp to={item.score} className="font-display font-semibold text-4xl text-good" />
            <span className="text-sm text-muted">/ 100</span>
          </div>
          <p className="text-xs text-sage-ink bg-sage rounded-lg px-2 py-1.5 mt-2">✓ {item.good}</p>
          <p className="text-xs text-peach-ink bg-peach rounded-lg px-2 py-1.5 mt-1.5">→ Next: {item.next}</p>
        </div>
      )}

      <div className="absolute -left-3 sm:-left-8 top-16 rounded-2xl bg-card border border-line shadow-lg px-3 py-2 flex items-center gap-2 motion-safe:animate-[float_7s_ease-in-out_infinite_1s]">
        <Chip tint="peach" icon="flame" />
        <span className="text-xs leading-tight"><b className="block text-sm">5-day streak</b><span className="text-muted">Keep it going</span></span>
      </div>
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

const TOPICS = ['Tell me about yourself', 'DSA', 'SQL joins', 'OOP', 'React hooks', 'Java', 'Python', 'DBMS', 'Operating systems', 'Computer networks', 'Your final-year project', 'STAR answers', 'Strengths & weaknesses', 'System design basics', 'Why should we hire you?', 'Excel & Power BI']

// An endless, slowly scrolling ribbon of things students can practise.
function TopicRibbon() {
  const row = [...TOPICS, ...TOPICS]
  return (
    <div className="relative border-y border-line bg-card py-5 overflow-hidden" aria-label="Topics you can practise">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-linear-to-r from-card to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-linear-to-l from-card to-transparent z-10" />
      <ul className="flex w-max gap-3 motion-safe:animate-[marquee_45s_linear_infinite] hover:[animation-play-state:paused]">
        {row.map((t, i) => (
          <li key={i} aria-hidden={i >= TOPICS.length} className="shrink-0 rounded-full border border-line bg-paper px-4 py-2 text-sm font-medium text-soft">
            {t}
          </li>
        ))}
      </ul>
    </div>
  )
}

const PAINS: { pain: string; fix: string; icon: IconName; tint: Tint }[] = [
  { pain: 'I freeze when they ask', fix: 'Practise out loud until it feels normal', icon: 'mic', tint: 'sky' },
  { pain: "I don't know what they'll ask", fix: 'Questions made for your role and company', icon: 'target', tint: 'lavender' },
  { pain: 'Rejected, and nobody told me why', fix: 'An honest report after every interview', icon: 'reports', tint: 'sage' },
  { pain: 'I study random topics', fix: 'A weekly plan built from your gaps', icon: 'map', tint: 'peach' },
  { pain: 'Mock interviews cost money', fix: 'Completely free, any time', icon: 'check', tint: 'blush' },
]

// A card that shows the worry first, then turns over to show the fix.
// It flips by itself once it scrolls into view; tapping flips it back and forth.
function FlipCard({ p, index }: { p: (typeof PAINS)[number]; index: number }) {
  const { ref, inView } = useInView<HTMLButtonElement>(0.4)
  const [flipped, setFlipped] = useState(false)
  useEffect(() => {
    if (!inView) return
    const t = setTimeout(() => setFlipped(true), 900 + index * 450)
    return () => clearTimeout(t)
  }, [inView, index])

  return (
    <button ref={ref} type="button" onClick={() => setFlipped((f) => !f)} aria-label={`${p.pain}. Fix: ${p.fix}`}
      className="h-28 sm:h-44 w-full perspective-[1000px] text-left">
      <span className={`relative block h-full w-full transition-transform duration-700 transform-3d ${flipped ? 'rotate-y-180' : ''}`}>
        {/* Front: the worry */}
        <span className="absolute inset-0 rounded-2xl bg-card border border-line p-5 flex flex-row sm:flex-col items-center sm:items-start gap-4 sm:justify-between backface-hidden">
          <span className="w-10 h-10 shrink-0 rounded-xl bg-blush text-blush-ink flex items-center justify-center"><Icon name="alert" size={18} /></span>
          <span className="font-display font-semibold text-xl leading-snug">"{p.pain}"</span>
        </span>
        {/* Back: the fix */}
        <span className="absolute inset-0 rounded-2xl bg-linear-to-br from-accent-soft to-card border border-accent/30 p-5 flex flex-row sm:flex-col items-center sm:items-start gap-4 sm:justify-between shadow-md backface-hidden rotate-y-180">
          <Chip tint={p.tint} icon={p.icon} />
          <span className="font-semibold leading-snug">{p.fix}</span>
        </span>
      </span>
    </button>
  )
}

function Problems() {
  return (
    <Section id="problems" eyebrow="Sound familiar?" title="Every student feels this before placements.">
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { src: '/stressed-girl.webp', alt: 'A student worried about forgetting concepts, explaining her project and getting placed' },
          { src: '/stressed-boy.webp', alt: 'A student stressed about coding problems, his resume and failing again' },
        ].map((img, i) => (
          <Reveal key={img.src} from="zoom" delay={i * 150}>
            <figure className="rounded-3xl overflow-hidden border border-line shadow-sm group">
              <img src={img.src} alt={img.alt} loading="lazy" className="w-full aspect-3/2 object-cover transition-transform duration-1000 group-hover:scale-105" />
            </figure>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-12 flex items-center gap-3">
        <span className="h-px flex-1 bg-linear-to-r from-transparent to-line-strong" />
        <span className="flex items-center gap-2 rounded-full bg-card border border-line px-4 py-2 text-sm font-semibold text-accent shadow-sm">
          <img src="/logo-mark.png" alt="" className="w-5 h-5" /> Watch ReadyForRound fix each one
        </span>
        <span className="h-px flex-1 bg-linear-to-l from-transparent to-line-strong" />
      </Reveal>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {PAINS.map((p, i) => (
          <li key={p.pain}><Reveal delay={i * 80}><FlipCard p={p} index={i} /></Reveal></li>
        ))}
      </ul>
      <p className="text-xs text-muted text-center mt-4">Tap a card to flip it</p>
    </Section>
  )
}

const STEPS: { icon: IconName; tint: Tint; title: string; body: string }[] = [
  { icon: 'goals', tint: 'lavender', title: 'Pick your goal', body: 'Role, company type, interview date.' },
  { icon: 'mic', tint: 'sky', title: 'Talk it out', body: 'A 10-minute interview, by voice.' },
  { icon: 'reports', tint: 'sage', title: 'Get your plan', body: 'Score, gaps and what to study next.' },
]

function HowItWorks() {
  const { ref, inView } = useInView<HTMLOListElement>(0.35)
  return (
    <Section id="how" eyebrow="How it works" title="Three steps. Ten minutes." className="bg-card border-y border-line" center>
      <ol ref={ref} className="grid gap-10 md:gap-6 md:grid-cols-3 relative">
        {/* The line between the steps draws itself from left to right */}
        <span aria-hidden="true" className="hidden md:block absolute top-7 left-[16%] right-[16%] h-0.5 bg-line" />
        <span aria-hidden="true" className={`hidden md:block absolute top-7 left-[16%] h-0.5 bg-linear-to-r from-[#a99af0] via-[#7fbbf0] to-[#8fd1a6] transition-all duration-1500 ease-out ${inView ? 'right-[16%]' : 'right-[84%]'}`} />
        {STEPS.map((s, i) => (
          <li key={s.title} style={{ transitionDelay: `${300 + i * 450}ms` }}
            className={`relative flex flex-col items-center text-center transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <span className={`rounded-2xl ring-8 ring-card transition-transform duration-500 ${inView ? 'scale-100' : 'scale-50'}`} style={{ transitionDelay: `${300 + i * 450}ms` }}>
              <Chip tint={s.tint} icon={s.icon} size="lg" />
            </span>
            <span className="mt-4 text-xs font-semibold text-muted">STEP {i + 1}</span>
            <h3 className="text-xl font-semibold mt-1">{s.title}</h3>
            <p className="text-soft mt-1">{s.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  )
}

const FEATURES: { icon: IconName; tint: Tint; title: string }[] = [
  { icon: 'mic', tint: 'sky', title: 'Voice interviews' },
  { icon: 'repeat', tint: 'lavender', title: 'Real follow-ups' },
  { icon: 'swap', tint: 'peach', title: 'All 4 rounds' },
  { icon: 'reports', tint: 'sage', title: 'Feedback reports' },
  { icon: 'target', tint: 'blush', title: 'Claimed vs proven skills' },
  { icon: 'map', tint: 'lavender', title: 'Study roadmap' },
  { icon: 'bolt', tint: 'peach', title: '5-minute drills' },
  { icon: 'flame', tint: 'blush', title: 'Streaks & progress' },
  { icon: 'book', tint: 'sky', title: 'Interview guides' },
  { icon: 'goals', tint: 'sage', title: 'Grows with your career' },
  { icon: 'keyboard', tint: 'lavender', title: 'Type or speak' },
  { icon: 'shield', tint: 'sky', title: 'Video never recorded' },
]

function Features() {
  return (
    <Section id="features" eyebrow="Everything you get" title="One app. Your whole prep." center>
      <ul className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <li key={f.title}>
            <Reveal delay={(i % 4) * 90 + Math.floor(i / 4) * 60} className="h-full">
              <div className="group h-full rounded-2xl bg-card border border-line p-5 flex flex-col items-center text-center gap-3 hover:border-accent/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <span className="transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"><Chip tint={f.tint} icon={f.icon} size="lg" /></span>
                <span className="font-semibold leading-snug">{f.title}</span>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
      <Reveal className="mt-8 flex flex-wrap justify-center gap-2 text-sm">
        <span className="text-muted mr-1">Rounds:</span>
        {['Technical', 'Project deep-dive', 'Behavioural', 'HR'].map((r) => (
          <span key={r} className="rounded-full bg-accent-soft text-accent-deep px-3 py-1 font-medium">{r}</span>
        ))}
      </Reveal>
    </Section>
  )
}

function FreeBanner() {
  return (
    <section className="px-4 sm:px-6 py-16">
      <Reveal from="zoom">
        <div className="relative max-w-6xl mx-auto overflow-hidden rounded-3xl bg-linear-to-br from-sage via-sky to-lavender border border-line px-6 py-14 sm:py-20 text-center">
          <div aria-hidden="true" className="absolute -top-20 -left-10 w-72 h-72 rounded-full bg-card/40 blur-3xl motion-safe:animate-[blob-drift_16s_ease-in-out_infinite]" />
          <div aria-hidden="true" className="absolute -bottom-24 right-0 w-80 h-80 rounded-full bg-blush/60 blur-3xl motion-safe:animate-[blob-drift_20s_ease-in-out_infinite_reverse]" />
          <p className={`relative font-display font-semibold text-6xl sm:text-8xl leading-none ${GRADIENT_TEXT}`}>100% free</p>
          <p className="relative text-xl sm:text-2xl font-semibold mt-4">For every student. No catch.</p>
          <ul className="relative mt-8 flex flex-wrap justify-center gap-3">
            {['No credit card', 'No trial that runs out', 'No ads', 'We never sell your data'].map((t, i) => (
              <li key={t}>
                <Reveal delay={200 + i * 100}>
                  <span className="inline-flex items-center gap-2 rounded-full bg-card/85 px-4 py-2 text-sm font-medium shadow-sm">
                    <Icon name="check" size={15} strokeWidth={2.6} className="text-good" /> {t}
                  </span>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  )
}

function SampleReport() {
  const { ref, inView } = useInView<HTMLDivElement>(0.4)
  const R = 42
  const C = 2 * Math.PI * R // the ring's length; we hide part of it to show the score
  return (
    <Section eyebrow="Your feedback" title="Know exactly what to fix." className="bg-card border-y border-line">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] items-center">
        <Reveal from="left">
          <div ref={ref} className="rounded-3xl bg-paper border border-line p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Technical round · Frontend</span>
              <span className="uppercase tracking-wider">Sample report</span>
            </div>
            <div className="flex items-center gap-5 mt-5">
              {/* Score ring fills up when it scrolls into view */}
              <div className="relative w-24 h-24 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" aria-hidden="true">
                  <circle cx="50" cy="50" r={R} fill="none" strokeWidth="9" className="stroke-line" />
                  <circle cx="50" cy="50" r={R} fill="none" strokeWidth="9" strokeLinecap="round" className="stroke-good transition-[stroke-dashoffset] duration-1500 ease-out"
                    strokeDasharray={C} strokeDashoffset={inView ? C * (1 - 0.68) : C} />
                </svg>
                <span className="absolute inset-0 flex flex-col items-center justify-center">
                  {inView ? <CountUp to={68} duration={1400} className="font-display font-semibold text-3xl leading-none" /> : <span className="font-display font-semibold text-3xl leading-none">0</span>}
                  <span className="text-[10px] text-muted">out of 100</span>
                </span>
              </div>
              <p className="text-soft">Good React basics. Explain <b className="text-ink">why</b>, not only <b className="text-ink">what</b>.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 mt-6">
              <div className={`rounded-xl bg-sage text-sage-ink p-4 transition-all duration-500 delay-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
                <p className="text-xs font-semibold uppercase tracking-wider">Went well</p>
                <p className="text-sm mt-1.5">Props vs state, with a real example.</p>
              </div>
              <div className={`rounded-xl bg-peach text-peach-ink p-4 transition-all duration-500 delay-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
                <p className="text-xs font-semibold uppercase tracking-wider">Work on</p>
                <p className="text-sm mt-1.5">When useEffect cleanup runs.</p>
              </div>
            </div>
          </div>
        </Reveal>
        <ul className="space-y-6">
          {[
            { icon: 'check' as IconName, tint: 'sage' as Tint, t: 'A score for every answer' },
            { icon: 'book' as IconName, tint: 'sky' as Tint, t: 'A strong example answer to learn from' },
            { icon: 'map' as IconName, tint: 'lavender' as Tint, t: 'Gaps go straight into your study plan' },
            { icon: 'up' as IconName, tint: 'peach' as Tint, t: 'Watch your scores rise over time' },
          ].map((x, i) => (
            <li key={x.t}>
              <Reveal from="right" delay={i * 120} className="flex items-center gap-4">
                <Chip tint={x.tint} icon={x.icon} />
                <span className="text-lg font-semibold">{x.t}</span>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}

const FAQS = [
  { q: 'Is it really free?', a: 'Yes, completely free for students. A small daily limit (5 interviews and 10 drills) keeps it free for everyone. It resets at midnight.' },
  { q: 'Do I need a camera?', a: 'No. The camera is optional and never recorded. You can even type your answers instead of speaking.' },
  { q: 'Is it like a real interview?', a: 'The interviewer speaks every question, listens to your answer and asks follow-ups when you are vague, just like a real one.' },
  { q: 'How accurate is the feedback?', a: 'It is AI feedback: a very useful guide, but it can make mistakes. Use it to find gaps and double-check facts as you study.' },
  { q: 'Does it work on my phone?', a: 'Yes, in any modern browser. Chrome or Edge on a laptop gives the best voice experience.' },
]

function Faq() {
  return (
    <Section id="faq" eyebrow="Questions" title="Quick answers">
      <div className="grid gap-3 max-w-3xl">
        {FAQS.map((f, i) => (
          <Reveal key={f.q} delay={i * 70}>
            <details className="group rounded-2xl bg-card border border-line px-5 py-4 open:shadow-md open:border-accent/30 transition-all">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-semibold">
                {f.q}
                <span className="w-8 h-8 shrink-0 rounded-full bg-raised flex items-center justify-center transition-transform duration-300 group-open:rotate-180 group-open:bg-accent-soft group-open:text-accent"><Icon name="down" size={16} /></span>
              </summary>
              <p className="text-soft mt-3 leading-relaxed motion-safe:animate-[pop-in_0.3s_ease-out]">{f.a}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

function FinalCta() {
  return (
    <section className="px-4 sm:px-6 pb-24">
      <Reveal from="zoom">
        <div className="relative max-w-6xl mx-auto overflow-hidden rounded-3xl bg-card border border-line px-6 py-16 sm:py-20 text-center shadow-sm">
          <div aria-hidden="true" className="pointer-events-none absolute -top-20 left-1/4 w-80 h-80 rounded-full bg-sky blur-3xl opacity-70 motion-safe:animate-[blob-drift_18s_ease-in-out_infinite]" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-1/4 w-80 h-80 rounded-full bg-lavender blur-3xl opacity-70 motion-safe:animate-[blob-drift_22s_ease-in-out_infinite_reverse]" />
          <div className="relative">
            <img src="/logo-mark.png" alt="" className="w-16 h-16 mx-auto motion-safe:animate-[float_5s_ease-in-out_infinite]" />
            <h2 className="font-display font-semibold text-4xl sm:text-6xl mt-6 leading-[1.05]">Your next interview is<br className="hidden sm:block" /> <span className={GRADIENT_TEXT}>a practice round away.</span></h2>
            <div className="mt-8 flex justify-center"><FreeBadge /></div>
            <div className="mt-6"><CtaButtons center /></div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

function Footer() {
  const contact = import.meta.env.VITE_CONTACT_EMAIL as string | undefined
  return (
    <footer className="border-t border-line px-4 sm:px-6 py-10">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <Brand size="sm" tagline />
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
