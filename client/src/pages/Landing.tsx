import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router'
import { useAuth } from '../auth/AuthProvider'
import { HeroDemo } from '../components/HeroDemo'
import { Globe } from '../components/Globe'
import { apiFetch } from '../lib/api'
import { Brand } from '../components/Brand'
import { Reveal } from '../components/Reveal'
import { LiveChecks, ProductVideo, RotatingWord, ScrollProgress, StatsStrip, Tour, WordReveal } from '../components/LandingMotion'
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

function CtaButtons() {
  return (
    <div className="flex flex-wrap gap-3">
      <Link to="/signup" className="group inline-flex items-center gap-2 min-h-12 px-6 rounded-lg bg-accent text-on-accent font-semibold hover:bg-accent-hover transition-colors">
        Start practising free <Icon name="arrow" size={18} className="group-hover:translate-x-1 transition-transform" />
      </Link>
      <a href="#video" className="group inline-flex items-center gap-2 min-h-12 px-5 rounded-lg border border-line-strong bg-card font-medium hover:bg-raised transition-colors">
        <span className="w-6 h-6 rounded-full bg-ink text-paper grid place-items-center"><Icon name="play" size={10} /></span> Watch the tour
      </a>
    </div>
  )
}

// A live line from the real Jobs Board data: "10,048 Software Development Engineer openings in India this month"
function LiveFact() {
  const [roles, setRoles] = useState<{ role: string; openings: number }[]>([])
  const [i, setI] = useState(0)
  useEffect(() => { apiFetch<{ roles: { role: string; openings: number }[] }>('/demo/fact').then((d) => setRoles(d.roles)).catch(() => {}) }, [])
  useEffect(() => {
    if (roles.length < 2) return
    const t = setInterval(() => setI((n) => (n + 1) % roles.length), 3500)
    return () => clearInterval(t)
  }, [roles.length])
  if (!roles.length) return null
  const r = roles[i]
  return (
    <p className="mt-6 flex items-center gap-2.5 text-sm text-soft" title="From job ads posted in India in the last 30 days (Adzuna), refreshed daily">
      <span className="relative flex w-2 h-2 shrink-0" aria-hidden="true">
        <span className="absolute inset-0 rounded-full bg-good opacity-60 motion-safe:animate-ping" />
        <span className="relative w-2 h-2 rounded-full bg-good" />
      </span>
      <span key={i} className="motion-safe:animate-[toast-in_0.4s_ease-out]">
        <b className="text-ink font-semibold tabular-nums">{r.openings.toLocaleString('en-IN')}</b> {r.role} openings in India this month
      </span>
    </p>
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
      <div className="max-w-7xl 2xl:max-w-[88rem] mx-auto h-16 px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-4">
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
    <section className="relative px-4 sm:px-6 lg:px-10 pt-10 sm:pt-14 pb-20 overflow-hidden">
      {/* Edge-to-edge backdrop: a faint dot grid that fades out, and soft brand light at the far left and right */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute inset-0 [background-image:radial-gradient(color-mix(in_srgb,var(--ink)_9%,transparent)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_35%,black_30%,transparent_80%)]" />
      </div>
      <div className="relative max-w-7xl 2xl:max-w-[88rem] mx-auto grid gap-12 lg:gap-16 xl:gap-20 lg:grid-cols-[1fr_1.05fr] items-center">
        <div>
          <h1 className="font-display font-semibold text-[2.5rem] sm:text-[3.25rem] lg:text-[3.4rem] xl:text-[3.9rem] 2xl:text-[4.25rem] leading-[1.05] tracking-tight">
            <WordReveal delay={120} lines={[
              ['Walk', 'into', 'your'],
              [<RotatingWord words={['placement', 'campus', 'first job', 'next job']} className={GRADIENT_TEXT} />, 'interview', 'like'],
              ["you've", 'already', 'done', 'it.'],
            ]} />
          </h1>
          <Reveal delay={650}>
            <p className="text-lg text-soft mt-6 max-w-md">
              For students, freshers and working professionals. Practise out loud with an AI interviewer, get honest feedback, and know exactly what to study next.
            </p>
          </Reveal>
          <Reveal delay={800} className="mt-8"><CtaButtons /></Reveal>
          <Reveal delay={900}><LiveFact /></Reveal>
          <div className="mt-8"><LiveChecks delay={1050} items={['Free to use', 'No credit card', 'Camera optional']} /></div>
        </div>

        <div className="relative">
          {/* A slowly turning globe behind the laptop: India highlighted, arcs flying out to cities worldwide */}
          <div aria-hidden="true" className="pointer-events-none absolute -right-[22%] -top-[30%] w-[min(105%,40rem)] aspect-square">
            <Globe />
          </div>
          <Reveal from="right" delay={300} className="relative"><HeroDemo /></Reveal>
        </div>
      </div>
    </section>
  )
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
      <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 items-start">
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
          <div aria-hidden="true" className="pointer-events-none absolute -top-24 right-10 w-[28rem] h-[28rem] rounded-full bg-[radial-gradient(closest-side,rgba(11,99,229,0.45),transparent)]" />
          <img aria-hidden="true" src="/logo-mark.png" alt="" className="pointer-events-none absolute -right-6 -bottom-10 w-52 h-52 opacity-20 rotate-12 hidden sm:block" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="text-white">
              <h2 className="font-display font-semibold text-3xl sm:text-4xl leading-tight">Your next interview is<br className="hidden sm:block" /> a practice round away.</h2>
              <p className="text-white/80 mt-3">Start your first mock interview in under a minute.</p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Link to="/signup" className="group inline-flex items-center gap-2 min-h-12 px-6 rounded-lg bg-white text-[#0b63e5] font-semibold hover:bg-white/90 transition-colors">
                Start practising free <Icon name="arrow" size={18} className="group-hover:translate-x-1 transition-transform" />
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
      <div className="max-w-7xl 2xl:max-w-[88rem] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
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
