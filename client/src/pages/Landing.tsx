import { useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router'
import { useAuth } from '../auth/AuthProvider'
import { Avatar, INTERVIEWERS, type InterviewerId } from '../components/Avatar'
import { Brand } from '../components/Brand'
import { IntroVideo, introVideoExists, isFirstVisit } from '../components/IntroVideo'
import { ThemeToggle } from '../components/ThemeToggle'
import { Icon, type IconName } from '../components/ui'

// The public front page. Students skim, so it's built from pictures and short lines, not paragraphs.
// Logged-in students skip straight to their Home.
export default function Landing() {
  const { session, loading } = useAuth()
  const [hasVideo, setHasVideo] = useState(false)
  const [showVideo, setShowVideo] = useState(false)

  // Play the intro automatically on a visitor's first visit (only if the video file is there).
  useEffect(() => {
    introVideoExists().then((ok) => {
      setHasVideo(ok)
      if (ok && isFirstVisit()) setShowVideo(true)
    })
  }, [])

  if (!loading && session) return <Navigate to="/home" replace />

  return (
    <div className="min-h-screen bg-paper text-ink overflow-x-hidden">
      <TopNav />
      <main>
        <Hero hasVideo={hasVideo} onWatch={() => setShowVideo(true)} />
        <Problems />
        <Interviewers />
        <HowItWorks />
        <Features />
        <FreeBanner />
        <SampleReport />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      {showVideo && <IntroVideo onClose={() => setShowVideo(false)} />}
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

function Section({ id, eyebrow, title, children, className = '', center = false }: { id?: string; eyebrow: string; title: ReactNode; children: ReactNode; className?: string; center?: boolean }) {
  return (
    <section id={id} className={`px-4 sm:px-6 py-20 sm:py-24 scroll-mt-16 ${className}`}>
      <div className="max-w-6xl mx-auto">
        <div className={center ? 'text-center max-w-2xl mx-auto' : 'max-w-2xl'}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
          <h2 className="font-display font-semibold text-4xl sm:text-5xl leading-[1.05] mt-3">{title}</h2>
        </div>
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
      <Link to="/signup" className="inline-flex items-center gap-2 min-h-12 px-6 rounded-xl bg-accent text-on-accent font-semibold shadow-lg shadow-accent/25 hover:bg-accent-hover">
        Start practising free <Icon name="arrow" size={18} />
      </Link>
      <Link to="/login" className="inline-flex items-center min-h-12 px-6 rounded-xl border border-line-strong bg-card font-medium hover:bg-raised">
        Log in
      </Link>
    </div>
  )
}

function FreeBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-sage text-sage-ink px-3.5 py-1.5 text-sm font-semibold">
      <Icon name="check" size={15} strokeWidth={2.6} /> 100% free for students
    </span>
  )
}

/* ---------- Sections ---------- */

function TopNav() {
  return (
    <header className="sticky top-0 z-40 bg-paper/80 backdrop-blur-md border-b border-line">
      <div className="max-w-6xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
        <Link to="/" aria-label="ReadyForRound home"><Brand /></Link>
        <nav aria-label="Sections" className="hidden md:flex items-center gap-7 text-sm text-soft">
          <a href="#problems" className="hover:text-ink">Why</a>
          <a href="#how" className="hover:text-ink">How it works</a>
          <a href="#features" className="hover:text-ink">Features</a>
          <a href="#faq" className="hover:text-ink">FAQ</a>
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

function Hero({ hasVideo, onWatch }: { hasVideo: boolean; onWatch: () => void }) {
  return (
    <section className="relative px-4 sm:px-6 pt-14 sm:pt-20 pb-20">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-md h-112 rounded-full bg-sky opacity-80 blur-3xl" />
        <div className="absolute top-10 -right-24 w-104 h-104 rounded-full bg-lavender opacity-80 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-blush opacity-60 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto grid gap-14 lg:grid-cols-[1.05fr_1fr] items-center">
        <div>
          <FreeBadge />
          <h1 className="font-display font-semibold text-5xl sm:text-6xl lg:text-[4.1rem] leading-[0.98] mt-6">
            Walk into your interview like you've{' '}
            <span className="bg-linear-to-r from-[#12a8f0] to-[#7b3cf0] bg-clip-text text-transparent">already done it.</span>
          </h1>
          <p className="text-lg sm:text-xl text-soft mt-6 max-w-lg">
            Real mock interviews by voice. Honest feedback. A plan for what to study next.
          </p>
          <div className="mt-8"><CtaButtons /></div>
          {hasVideo && (
            <button type="button" onClick={onWatch} className="mt-5 inline-flex items-center gap-3 text-sm font-medium text-soft hover:text-ink group">
              <span className="w-11 h-11 rounded-full bg-card border border-line-strong flex items-center justify-center text-accent shadow-sm group-hover:scale-105 transition-transform">
                <Icon name="play" size={16} />
              </span>
              Watch the intro
            </button>
          )}
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            {['No credit card', 'No hidden plans', 'Camera optional'].map((t) => (
              <li key={t} className="flex items-center gap-1.5"><Icon name="check" size={15} className="text-good" />{t}</li>
            ))}
          </ul>
        </div>

        <HeroMockup />
      </div>
    </section>
  )
}

// A picture of the product: an interview call with Priya and a floating feedback card.
function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-lg mb-16 sm:mb-10" aria-label="Example of an interview on ReadyForRound">
      <div className="rounded-3xl bg-stage-card border border-stage-line shadow-2xl shadow-accent/10 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-stage-line text-xs text-stage-muted">
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-bad animate-pulse" /> Technical round · Q2 of 5</span>
          <span className="font-mono">04:12</span>
        </div>
        <div className="bg-stage px-6 pt-8 pb-6 flex flex-col items-center">
          <div className="w-40 h-40 rounded-full overflow-hidden shadow-[0_0_0_6px_rgba(var(--glow-rgb),0.35),0_0_50px_rgba(var(--glow-rgb),0.25)]">
            <Avatar who="priya" state="speaking" />
          </div>
          <p className="mt-3 text-xs text-stage-muted">Priya · Interviewer</p>
          <div className="mt-5 w-full rounded-2xl bg-stage-card border border-stage-line px-4 py-3">
            <p className="font-display text-xl leading-snug text-stage-text">
              When would you choose a LEFT JOIN over an INNER JOIN?
            </p>
          </div>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent text-on-accent px-4 py-2 text-sm font-semibold">
            <Icon name="mic" size={15} /> Start answering
          </span>
        </div>
      </div>

      <div className="absolute -right-2 sm:-right-12 -bottom-32 w-56 rounded-2xl bg-card border border-line shadow-xl p-4 motion-safe:animate-[float_6s_ease-in-out_infinite]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted">Your feedback</span>
          <span className="text-[10px] uppercase tracking-wider text-muted">Example</span>
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="font-display font-semibold text-4xl text-good">72</span>
          <span className="text-sm text-muted">/ 100</span>
        </div>
        <p className="text-xs text-sage-ink bg-sage rounded-lg px-2 py-1.5 mt-2">✓ Clear explanation</p>
        <p className="text-xs text-peach-ink bg-peach rounded-lg px-2 py-1.5 mt-1.5">→ Study next: GROUP BY</p>
      </div>

      <div className="absolute -left-3 sm:-left-8 top-16 rounded-2xl bg-card border border-line shadow-lg px-3 py-2 flex items-center gap-2 motion-safe:animate-[float_7s_ease-in-out_infinite_1s]">
        <Chip tint="peach" icon="flame" />
        <span className="text-xs leading-tight"><b className="block text-sm">5-day streak</b><span className="text-muted">Keep it going</span></span>
      </div>
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

function Problems() {
  return (
    <Section id="problems" eyebrow="Sound familiar?" title="Every student feels this before placements.">
      <div className="grid gap-4 sm:grid-cols-2">
        <figure className="rounded-3xl overflow-hidden border border-line shadow-sm">
          <img src="/stressed-girl.webp" alt="A student worried about forgetting concepts, explaining her project and getting placed" loading="lazy" className="w-full aspect-3/2 object-cover" />
        </figure>
        <figure className="rounded-3xl overflow-hidden border border-line shadow-sm">
          <img src="/stressed-boy.webp" alt="A student stressed about coding problems, his resume and failing again" loading="lazy" className="w-full aspect-3/2 object-cover" />
        </figure>
      </div>

      <div className="mt-10 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="flex items-center gap-2 text-sm font-semibold text-accent"><img src="/logo-mark.png" alt="" className="w-6 h-6" /> ReadyForRound fixes this</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {PAINS.map((p) => (
          <li key={p.pain} className="rounded-2xl bg-card border border-line p-5 flex flex-col gap-3 hover:-translate-y-0.5 hover:shadow-md transition">
            <p className="text-sm text-muted line-through decoration-bad/50">{p.pain}</p>
            <Chip tint={p.tint} icon={p.icon} />
            <p className="font-semibold leading-snug">{p.fix}</p>
          </li>
        ))}
      </ul>
    </Section>
  )
}

function Interviewers() {
  return (
    <Section eyebrow="Meet your interviewers" title="Real conversations, not a quiz." className="bg-card border-y border-line" center>
      <div className="grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
        {(Object.keys(INTERVIEWERS) as InterviewerId[]).map((id) => (
          <article key={id} className="rounded-3xl bg-paper border border-line overflow-hidden text-center">
            <div className="aspect-square overflow-hidden">
              <img src={INTERVIEWERS[id].photo} alt={`${INTERVIEWERS[id].name}, AI interviewer`} loading="lazy" className="w-full h-full object-cover object-top hover:scale-[1.03] transition-transform duration-500" />
            </div>
            <div className="p-5">
              <h3 className="font-display font-semibold text-3xl">{INTERVIEWERS[id].name}</h3>
              <p className="text-soft mt-1">Your AI interviewer</p>
            </div>
          </article>
        ))}
      </div>
      <p className="text-soft text-center mt-6">Pick who you'd like to practise with. They speak every question out loud and listen to your answers.</p>
    </Section>
  )
}

const STEPS: { icon: IconName; tint: Tint; title: string; body: string }[] = [
  { icon: 'goals', tint: 'lavender', title: 'Pick your goal', body: 'Role, company type, interview date.' },
  { icon: 'mic', tint: 'sky', title: 'Talk it out', body: 'A 10-minute interview, by voice.' },
  { icon: 'reports', tint: 'sage', title: 'Get your plan', body: 'Score, gaps and what to study next.' },
]

function HowItWorks() {
  return (
    <Section id="how" eyebrow="How it works" title="Three steps. Ten minutes." center>
      <ol className="grid gap-6 md:grid-cols-3 relative">
        <span aria-hidden="true" className="hidden md:block absolute top-7 left-[16%] right-[16%] h-0.5 bg-linear-to-r from-lavender via-sky to-sage" />
        {STEPS.map((s, i) => (
          <li key={s.title} className="relative flex flex-col items-center text-center">
            <Chip tint={s.tint} icon={s.icon} size="lg" />
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
    <Section id="features" eyebrow="Everything you get" title="One app. Your whole prep." className="bg-card border-y border-line" center>
      <ul className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <li key={f.title} className="rounded-2xl bg-paper border border-line p-5 flex flex-col items-center text-center gap-3 hover:border-accent/40 hover:-translate-y-0.5 transition">
            <Chip tint={f.tint} icon={f.icon} size="lg" />
            <span className="font-semibold leading-snug">{f.title}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap justify-center gap-2 text-sm">
        <span className="text-muted mr-1">Rounds:</span>
        {['Technical', 'Project deep-dive', 'Behavioural', 'HR'].map((r) => (
          <span key={r} className="rounded-full bg-accent-soft text-accent-deep px-3 py-1 font-medium">{r}</span>
        ))}
      </div>
    </Section>
  )
}

function FreeBanner() {
  return (
    <section className="px-4 sm:px-6 py-20">
      <div className="relative max-w-6xl mx-auto overflow-hidden rounded-3xl bg-linear-to-br from-sage via-sky to-lavender border border-line px-6 py-14 sm:py-16 text-center">
        <p className="font-display font-semibold text-6xl sm:text-8xl leading-none bg-linear-to-r from-[#12a8f0] to-[#7b3cf0] bg-clip-text text-transparent">100% free</p>
        <p className="text-xl sm:text-2xl font-semibold mt-4">For every student. No catch.</p>
        <ul className="mt-8 flex flex-wrap justify-center gap-3">
          {['No credit card', 'No trial that runs out', 'No ads', 'We never sell your data'].map((t) => (
            <li key={t} className="inline-flex items-center gap-2 rounded-full bg-card/80 px-4 py-2 text-sm font-medium">
              <Icon name="check" size={15} strokeWidth={2.6} className="text-good" /> {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function SampleReport() {
  return (
    <Section eyebrow="Your feedback" title="Know exactly what to fix.">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] items-center">
        <div className="rounded-3xl bg-card border border-line p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Technical round · Frontend</span>
            <span className="uppercase tracking-wider">Sample report</span>
          </div>
          <div className="flex items-center gap-5 mt-5">
            <div className="w-24 h-24 shrink-0 rounded-full border-[6px] border-good/80 flex flex-col items-center justify-center">
              <span className="font-display font-semibold text-3xl leading-none">68</span>
              <span className="text-[10px] text-muted">out of 100</span>
            </div>
            <p className="text-soft">Good React basics. Explain <b className="text-ink">why</b>, not only <b className="text-ink">what</b>.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 mt-6">
            <div className="rounded-xl bg-sage text-sage-ink p-4">
              <p className="text-xs font-semibold uppercase tracking-wider">Went well</p>
              <p className="text-sm mt-1.5">Props vs state, with a real example.</p>
            </div>
            <div className="rounded-xl bg-peach text-peach-ink p-4">
              <p className="text-xs font-semibold uppercase tracking-wider">Work on</p>
              <p className="text-sm mt-1.5">When useEffect cleanup runs.</p>
            </div>
          </div>
        </div>
        <ul className="space-y-6">
          {[
            { icon: 'check' as IconName, tint: 'sage' as Tint, t: 'A score for every answer' },
            { icon: 'book' as IconName, tint: 'sky' as Tint, t: 'A strong example answer to learn from' },
            { icon: 'map' as IconName, tint: 'lavender' as Tint, t: 'Gaps go straight into your study plan' },
            { icon: 'up' as IconName, tint: 'peach' as Tint, t: 'Watch your scores rise over time' },
          ].map((x) => (
            <li key={x.t} className="flex items-center gap-4">
              <Chip tint={x.tint} icon={x.icon} />
              <span className="text-lg font-semibold">{x.t}</span>
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
    <Section id="faq" eyebrow="Questions" title="Quick answers" className="bg-card border-y border-line">
      <div className="grid gap-3 max-w-3xl">
        {FAQS.map((f) => (
          <details key={f.q} className="group rounded-2xl bg-paper border border-line px-5 py-4">
            <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-semibold">
              {f.q}
              <span className="w-8 h-8 shrink-0 rounded-full bg-raised flex items-center justify-center transition-transform group-open:rotate-180"><Icon name="down" size={16} /></span>
            </summary>
            <p className="text-soft mt-3 leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>
    </Section>
  )
}

function FinalCta() {
  return (
    <section className="px-4 sm:px-6 py-24">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex justify-center -space-x-4">
          {(Object.keys(INTERVIEWERS) as InterviewerId[]).map((id) => (
            <img key={id} src={INTERVIEWERS[id].photo} alt="" className="w-20 h-20 rounded-full object-cover object-top ring-4 ring-paper" />
          ))}
        </div>
        <h2 className="font-display font-semibold text-4xl sm:text-6xl mt-6 leading-[1.02]">Your interviewer is ready.<br className="hidden sm:block" /> Are you?</h2>
        <div className="mt-8 flex justify-center"><FreeBadge /></div>
        <div className="mt-6"><CtaButtons center /></div>
      </div>
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
