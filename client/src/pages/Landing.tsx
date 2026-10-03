import { useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router'
import { useAuth } from '../auth/AuthProvider'
import { Avatar } from '../components/Avatar'
import { Brand } from '../components/Brand'
import { IntroVideo, introVideoExists, isFirstVisit } from '../components/IntroVideo'
import { ThemeToggle } from '../components/ThemeToggle'
import { Icon, type IconName } from '../components/ui'

// The public front page: what students struggle with, how ReadyForRound fixes it, and every feature.
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
        <HowItWorks />
        <Features />
        <SampleReport />
        <ForWho />
        <Privacy />
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

function Section({ id, eyebrow, title, subtitle, children, className = '' }: { id?: string; eyebrow: string; title: ReactNode; subtitle?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`px-4 sm:px-6 py-20 sm:py-24 scroll-mt-16 ${className}`}>
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
          <h2 className="font-display font-semibold text-4xl sm:text-5xl leading-[1.05] mt-3">{title}</h2>
          {subtitle && <p className="text-lg text-soft mt-4 leading-relaxed">{subtitle}</p>}
        </div>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  )
}

function Chip({ tint, icon, size = 'md' }: { tint: Tint; icon: IconName; size?: 'md' | 'lg' }) {
  return (
    <span className={`${size === 'lg' ? 'w-12 h-12 rounded-2xl' : 'w-10 h-10 rounded-xl'} shrink-0 flex items-center justify-center ${TINTS[tint]}`}>
      <Icon name={icon} size={size === 'lg' ? 22 : 18} />
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
      {/* Soft colour glows behind the hero */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-sky opacity-80 blur-3xl" />
        <div className="absolute top-10 right-[-6rem] w-[26rem] h-[26rem] rounded-full bg-lavender opacity-80 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/3 w-[24rem] h-[24rem] rounded-full bg-blush opacity-60 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto grid gap-14 lg:grid-cols-[1.05fr_1fr] items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-card/80 border border-line px-3 py-1.5 text-xs font-medium text-soft">
            <span className="w-2 h-2 rounded-full bg-good" /> Free for students · built for campus placements
          </span>
          <h1 className="font-display font-semibold text-5xl sm:text-6xl lg:text-[4.1rem] leading-[0.98] mt-6">
            Walk into your interview like you've{' '}
            <span className="bg-linear-to-r from-[#12a8f0] to-[#7b3cf0] bg-clip-text text-transparent">already done it.</span>
          </h1>
          <p className="text-lg sm:text-xl text-soft mt-6 leading-relaxed max-w-xl">
            Practise real interview rounds out loud with an AI interviewer. Get honest feedback in minutes, and a clear plan for what to study next.
          </p>
          <div className="mt-8"><CtaButtons /></div>
          {hasVideo && (
            <button type="button" onClick={onWatch} className="mt-5 inline-flex items-center gap-3 text-sm font-medium text-soft hover:text-ink group">
              <span className="w-10 h-10 rounded-full bg-card border border-line-strong flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
                <Icon name="play" size={16} />
              </span>
              Watch the intro
            </button>
          )}
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            {['No credit card', 'Works in your browser', 'Camera optional'].map((t) => (
              <li key={t} className="flex items-center gap-1.5"><Icon name="check" size={15} className="text-good" />{t}</li>
            ))}
          </ul>
        </div>

        <HeroMockup />
      </div>
    </section>
  )
}

// A picture of the product: an interview call with a floating feedback card. Built from the real components.
function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-lg mb-16 sm:mb-10" aria-label="Example of an interview on ReadyForRound">
      <div className="rounded-3xl bg-stage-card border border-stage-line shadow-2xl shadow-accent/10 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-stage-line text-xs text-stage-muted">
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-bad animate-pulse" /> Technical round · Q2 of 5</span>
          <span className="font-mono">04:12</span>
        </div>
        <div className="bg-stage px-6 pt-8 pb-6 flex flex-col items-center">
          <div className="relative">
            <span aria-hidden="true" className="absolute -inset-3 rounded-full motion-safe:animate-[ring-glow_2.8s_ease-in-out_infinite]" />
            <div className="w-36 h-36 rounded-full overflow-hidden ring-4 ring-accent/40 bg-[radial-gradient(circle_at_50%_35%,var(--avatar-from),var(--avatar-to))]">
              <Avatar who="priya" state="speaking" />
            </div>
          </div>
          <p className="mt-3 text-xs text-stage-muted">Priya · Interviewer</p>
          <div className="mt-5 w-full rounded-2xl bg-stage-card border border-stage-line px-4 py-3">
            <p className="text-[11px] font-semibold text-accent">Priya</p>
            <p className="font-display text-xl leading-snug text-stage-text mt-0.5">
              Good. And when would you choose a LEFT JOIN over an INNER JOIN?
            </p>
          </div>
          <div className="mt-5 flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent text-on-accent px-4 py-2 text-sm font-semibold">
              <Icon name="mic" size={15} /> Start answering
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-stage-raised px-3 py-2 text-xs text-stage-soft">
              <Icon name="repeat" size={13} /> Repeat
            </span>
          </div>
        </div>
      </div>

      {/* Floating feedback card */}
      <div className="absolute -right-2 sm:-right-10 -bottom-24 w-60 rounded-2xl bg-card border border-line shadow-xl p-4 motion-safe:animate-[float_6s_ease-in-out_infinite]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted">Your feedback</span>
          <span className="text-[10px] uppercase tracking-wider text-muted">Example</span>
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="font-display font-semibold text-4xl text-good">72</span>
          <span className="text-sm text-muted">/ 100</span>
        </div>
        <p className="text-xs text-sage-ink bg-sage rounded-lg px-2 py-1.5 mt-2">✓ Clear explanation of joins</p>
        <p className="text-xs text-peach-ink bg-peach rounded-lg px-2 py-1.5 mt-1.5">→ Study next: GROUP BY with HAVING</p>
      </div>

      {/* Floating streak chip */}
      <div className="absolute -left-3 sm:-left-8 top-16 rounded-2xl bg-card border border-line shadow-lg px-3 py-2 flex items-center gap-2 motion-safe:animate-[float_7s_ease-in-out_infinite_1s]">
        <Chip tint="peach" icon="flame" />
        <span className="text-xs leading-tight"><b className="block text-sm">5-day streak</b><span className="text-muted">Keep it going</span></span>
      </div>
    </div>
  )
}

const PROBLEMS: { tint: Tint; icon: IconName; pain: string; fix: string }[] = [
  { tint: 'blush', icon: 'alert', pain: '"I know the answer, but I freeze when someone actually asks."',
    fix: 'Practise out loud with an AI interviewer that speaks, listens and asks follow-ups, until speaking under pressure feels normal.' },
  { tint: 'sky', icon: 'target', pain: '"I don\'t know what they\'ll ask for my role."',
    fix: 'Questions are shaped for your role, your level and the kind of company you\'re aiming for: service, product or startup.' },
  { tint: 'peach', icon: 'trophy', pain: '"Mock interviews cost money, or I have to wait for a senior to be free."',
    fix: 'Practise any time, as often as you like within a generous daily limit. It\'s free for students.' },
  { tint: 'lavender', icon: 'reports', pain: '"I got rejected and nobody told me why."',
    fix: 'Every interview ends with an honest report: what went well, what was missing, and one strong way to answer each question.' },
  { tint: 'sage', icon: 'map', pain: '"I study random topics and still don\'t feel ready."',
    fix: 'Your weak spots become a weekly study plan, sized to the hours you actually have before your placement date.' },
  { tint: 'sky', icon: 'volume', pain: '"English isn\'t my first language, so I get nervous."',
    fix: 'Slow the interviewer down, repeat any question, or type instead of speaking. There\'s even a no-scores mode to build confidence first.' },
]

function Problems() {
  return (
    <Section id="problems" eyebrow="Sound familiar?" title="Placement prep is stressful. It doesn't have to be."
      subtitle="Most students don't fail interviews because they lack knowledge. They fail because they never practised saying it out loud, under pressure, with feedback.">
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {PROBLEMS.map((p) => (
          <article key={p.pain} className="rounded-2xl bg-card border border-line p-6 flex flex-col shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
            <Chip tint={p.tint} icon={p.icon} />
            <p className="font-display font-semibold text-2xl leading-snug mt-5">{p.pain}</p>
            <div className="flex-1" />
            <p className="mt-5 pt-5 border-t border-line text-[15px] text-soft leading-relaxed">
              <span className="font-semibold text-accent">How we fix it: </span>{p.fix}
            </p>
          </article>
        ))}
      </div>
    </Section>
  )
}

const STEPS: { icon: IconName; tint: Tint; title: string; body: string }[] = [
  { icon: 'goals', tint: 'lavender', title: 'Tell us your goal', body: 'Pick your role, your year, the type of company and your interview date. Add your skills and rate yourself honestly.' },
  { icon: 'mic', tint: 'sky', title: 'Take a real interview', body: 'Join a video-call-style room. Your interviewer asks questions out loud; you answer by voice (or by typing). It takes about 10 minutes.' },
  { icon: 'reports', tint: 'sage', title: 'Get feedback and a plan', body: 'In about a minute you get a score, strengths, gaps, model answers and exactly what to study next.' },
]

function HowItWorks() {
  return (
    <Section id="how" eyebrow="How it works" title="From nervous to ready in three steps" className="bg-card border-y border-line">
      <ol className="grid gap-6 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="relative rounded-2xl bg-paper border border-line p-6">
            <span className="absolute top-5 right-6 font-display font-semibold text-6xl text-line-strong select-none" aria-hidden="true">{i + 1}</span>
            <Chip tint={s.tint} icon={s.icon} size="lg" />
            <h3 className="text-xl font-semibold mt-5">{s.title}</h3>
            <p className="text-soft mt-2 leading-relaxed">{s.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  )
}

const FEATURES: { icon: IconName; tint: Tint; title: string; body: string }[] = [
  { icon: 'mic', tint: 'sky', title: 'Voice interviews that feel real', body: 'An AI interviewer (Priya or Arjun) speaks every question. You press "Start answering" and talk, like a real call.' },
  { icon: 'repeat', tint: 'lavender', title: 'Real follow-up questions', body: 'Give a vague answer and you\'ll get "Can you explain why?", just like a real interviewer would ask.' },
  { icon: 'swap', tint: 'peach', title: 'Every round of a placement drive', body: 'Technical, Project deep-dive, Behavioural and HR. Practise one round, or a complete drive back to back.' },
  { icon: 'reports', tint: 'sage', title: 'Honest feedback reports', body: 'A score, what went well, what was missing, and one strong way to answer each question.' },
  { icon: 'target', tint: 'blush', title: 'Skills: claimed vs proven', body: 'See how your self-rating compares with what you actually showed in interviews.' },
  { icon: 'map', tint: 'lavender', title: 'A personal study roadmap', body: 'Weekly tasks built from your feedback: what to learn, what to practise, and what to build.' },
  { icon: 'bolt', tint: 'peach', title: '5-minute drills', body: 'Three quick questions on any topic, like "SQL joins" or "React hooks". Perfect before class or the night before.' },
  { icon: 'flame', tint: 'blush', title: 'Streaks and progress', body: 'Daily streaks, score trends over time and a readiness score that grows as you improve.' },
  { icon: 'book', tint: 'sky', title: 'Interview guides', body: 'Bite-sized tips: STAR answers, "Tell me about yourself", service vs product companies, the night before, and more.' },
  { icon: 'goals', tint: 'sage', title: 'Grows with your career', body: 'Placements today, your first switch tomorrow. Each goal keeps its own history.' },
  { icon: 'keyboard', tint: 'lavender', title: 'Comfortable for everyone', body: 'Slower speech, repeat questions, type instead of speak, a no-scores mode, and light or dark theme.' },
  { icon: 'calendar', tint: 'peach', title: 'Gentle reminders', body: 'In-app notifications for ready reports, this week\'s plan and your upcoming interview date. No spam.' },
]

function Features() {
  return (
    <Section id="features" eyebrow="Everything you get" title="One place to prepare, practise and progress"
      subtitle="Everything a student needs before placement season, in one simple app.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <article key={f.title} className="rounded-2xl bg-card border border-line p-5 flex gap-4 hover:border-accent/40 transition-colors">
            <Chip tint={f.tint} icon={f.icon} />
            <div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-soft mt-1 leading-relaxed">{f.body}</p>
            </div>
          </article>
        ))}
      </div>
    </Section>
  )
}

function SampleReport() {
  return (
    <Section eyebrow="See the feedback" title="Feedback that tells you exactly what to fix"
      subtitle="Not just a number. Every report explains your score and gives you a strong example answer to learn from."
      className="bg-card border-y border-line">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] items-start">
        <div className="rounded-3xl bg-paper border border-line p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Technical round · Frontend Developer</span>
            <span className="uppercase tracking-wider">Sample report</span>
          </div>
          <div className="flex items-center gap-5 mt-5">
            <div className="w-24 h-24 rounded-full border-[6px] border-good/80 flex flex-col items-center justify-center">
              <span className="font-display font-semibold text-3xl leading-none">68</span>
              <span className="text-[10px] text-muted">out of 100</span>
            </div>
            <p className="text-soft leading-relaxed flex-1">Good grasp of React basics. Answers got stronger with examples. Explain <b className="text-ink">why</b>, not only <b className="text-ink">what</b>.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 mt-6">
            <div className="rounded-xl bg-sage text-sage-ink p-4">
              <p className="text-xs font-semibold uppercase tracking-wider">What went well</p>
              <p className="text-sm mt-1.5">Clear explanation of props vs state with a real example.</p>
            </div>
            <div className="rounded-xl bg-peach text-peach-ink p-4">
              <p className="text-xs font-semibold uppercase tracking-wider">What to work on</p>
              <p className="text-sm mt-1.5">When a useEffect cleanup runs, and why it prevents memory leaks.</p>
            </div>
          </div>
          <div className="rounded-xl border border-line bg-card p-4 mt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Study next</p>
            <ol className="text-sm mt-2 space-y-1.5">
              <li><span className="font-mono text-accent mr-2">1</span>useEffect dependencies and cleanup</li>
              <li><span className="font-mono text-accent mr-2">2</span>Lifting state up vs Context</li>
              <li><span className="font-mono text-accent mr-2">3</span>Explaining your project's architecture in 60 seconds</li>
            </ol>
          </div>
        </div>
        <ul className="space-y-5">
          {[
            { icon: 'check' as IconName, tint: 'sage' as Tint, t: 'Scored question by question', b: 'Each answer gets a mark out of 10, with what was good and what was missing.' },
            { icon: 'book' as IconName, tint: 'sky' as Tint, t: 'Learn from a strong answer', b: 'Open "Show one strong way to answer" to see how a confident candidate would reply.' },
            { icon: 'map' as IconName, tint: 'lavender' as Tint, t: 'Turns into your study plan', b: 'Your gaps feed your roadmap automatically, so you always know what to do next.' },
            { icon: 'reports' as IconName, tint: 'peach' as Tint, t: 'Track your growth', b: 'Watch your scores rise across interviews, and your skills move from "claimed" to "proven".' },
          ].map((x) => (
            <li key={x.t} className="flex gap-4">
              <Chip tint={x.tint} icon={x.icon} />
              <div>
                <h3 className="font-semibold text-lg">{x.t}</h3>
                <p className="text-soft mt-1 leading-relaxed">{x.b}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}

function ForWho() {
  const roles = ['Frontend Developer', 'Backend Developer', 'Full-Stack Developer', 'Data Analyst']
  const who = [
    { tint: 'sky' as Tint, icon: 'profile' as IconName, t: 'Final & pre-final year students', b: 'Getting ready for campus placements and off-campus drives.' },
    { tint: 'lavender' as Tint, icon: 'trophy' as IconName, t: 'Freshers job hunting', b: 'Applying to service companies, product companies and startups.' },
    { tint: 'sage' as Tint, icon: 'up' as IconName, t: 'Anyone rusty at interviews', b: 'Haven\'t interviewed in a while? Warm up before the real thing.' },
  ]
  return (
    <Section eyebrow="Who it's for" title="Made for students like you">
      <div className="grid gap-5 md:grid-cols-3">
        {who.map((w) => (
          <div key={w.t} className="rounded-2xl bg-card border border-line p-6">
            <Chip tint={w.tint} icon={w.icon} />
            <h3 className="font-semibold text-lg mt-4">{w.t}</h3>
            <p className="text-soft mt-1">{w.b}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-2xl bg-card border border-line p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <p className="font-semibold shrink-0">Roles available now:</p>
        <ul className="flex flex-wrap gap-2">
          {roles.map((r) => <li key={r} className="rounded-full bg-accent-soft text-accent-deep px-3 py-1.5 text-sm font-medium">{r}</li>)}
          <li className="rounded-full border border-dashed border-line-strong text-muted px-3 py-1.5 text-sm">More coming soon</li>
        </ul>
      </div>
    </Section>
  )
}

function Privacy() {
  const points = [
    { icon: 'cameraOff' as IconName, t: 'Your video is never recorded', b: 'The camera is only there so it feels like a real call. Nothing is saved or uploaded.' },
    { icon: 'download' as IconName, t: 'Your data is yours', b: 'Download everything with one click, or delete your account and all your data any time.' },
    { icon: 'shield' as IconName, t: 'No spam, no selling', b: 'We never sell your data or show ads. Notifications stay inside the app.' },
  ]
  return (
    <section className="px-4 sm:px-6 pb-20">
      <div className="max-w-6xl mx-auto rounded-3xl bg-linear-to-br from-lavender via-sky to-sage border border-line p-8 sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lavender-ink">Privacy first</p>
        <h2 className="font-display font-semibold text-4xl sm:text-5xl mt-3 max-w-xl leading-[1.05]">Practise freely. Your mistakes stay private.</h2>
        <div className="grid gap-6 md:grid-cols-3 mt-10">
          {points.map((p) => (
            <div key={p.t} className="rounded-2xl bg-card/70 backdrop-blur p-5">
              <span className="w-10 h-10 rounded-xl bg-card flex items-center justify-center text-accent"><Icon name={p.icon} /></span>
              <h3 className="font-semibold mt-4">{p.t}</h3>
              <p className="text-sm text-soft mt-1 leading-relaxed">{p.b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const FAQS = [
  { q: 'Is it really free?', a: 'Yes. ReadyForRound is free for students. To keep it running for everyone there\'s a daily limit (5 interviews and 10 drills a day), which resets at midnight.' },
  { q: 'Do I need a camera or a good microphone?', a: 'No camera is needed; it\'s optional. A normal laptop or earphone mic works. You can also type your answers instead of speaking.' },
  { q: 'Is the AI interviewer like a real interview?', a: 'It asks role-specific questions out loud, listens to your answer, and asks follow-ups when your answer is vague, like a real interviewer. It\'s practice, so the real interview may differ, but the pressure of answering out loud is the same.' },
  { q: 'How accurate is the feedback?', a: 'Feedback is generated by AI and is usually a helpful guide, but it can make mistakes. Use it to find gaps, and double-check facts while you study.' },
  { q: 'Does it work on my phone?', a: 'Yes. It works in any modern browser. Chrome or Edge on a laptop gives the best voice experience.' },
  { q: 'Which roles and rounds can I practise?', a: 'Frontend, Backend, Full-Stack and Data Analyst roles, with Technical, Project deep-dive, Behavioural and HR rounds. More roles are coming.' },
]

function Faq() {
  return (
    <Section id="faq" eyebrow="Questions" title="Frequently asked questions">
      <div className="grid gap-3 max-w-3xl">
        {FAQS.map((f) => (
          <details key={f.q} className="group rounded-2xl bg-card border border-line px-5 py-4 open:shadow-sm">
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
    <section className="px-4 sm:px-6 pb-24">
      <div className="relative max-w-6xl mx-auto overflow-hidden rounded-3xl bg-card border border-line px-6 py-16 sm:py-20 text-center shadow-sm">
        <div aria-hidden="true" className="pointer-events-none absolute -top-20 left-1/4 w-80 h-80 rounded-full bg-sky blur-3xl opacity-70" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-1/4 w-80 h-80 rounded-full bg-lavender blur-3xl opacity-70" />
        <div className="relative">
          <img src="/logo-mark.png" alt="" className="w-16 h-16 mx-auto" />
          <h2 className="font-display font-semibold text-4xl sm:text-6xl mt-6 leading-[1.02]">Your next interview is a practice<br className="hidden sm:block" /> round away.</h2>
          <p className="text-lg text-soft mt-5 max-w-xl mx-auto">Create a free account and take your first mock interview in under 10 minutes.</p>
          <div className="mt-8"><CtaButtons center /></div>
        </div>
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
