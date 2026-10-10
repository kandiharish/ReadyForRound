import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useInView } from './Reveal'
import { Icon, type IconName } from './ui'

// Motion for the landing page. Everything is driven by scrolling or appears once, nothing loops for show,
// and people who ask their device for less motion get the final state straight away.

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// How far an element has travelled through the screen: 0 when its top reaches the bottom of the screen,
// 1 when its centre reaches the centre. Updated once per frame while scrolling.
function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [p, setP] = useState(() => (reduced() ? 1 : 0))
  useEffect(() => {
    if (reduced()) return
    let raf = 0
    const update = () => {
      raf = 0
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const start = vh, end = vh / 2 - r.height / 2
      setP(Math.min(1, Math.max(0, (start - r.top) / (start - end))))
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf) }
  }, [])
  return { ref, p }
}

// A thin brand-blue line under the top bar showing how far down the page you are.
export function ScrollProgress() {
  const [p, setP] = useState(0)
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      setP(max > 0 ? window.scrollY / max : 0)
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [])
  return <div aria-hidden="true" className="absolute left-0 bottom-0 h-0.5 bg-accent origin-left w-full" style={{ transform: `scaleX(${p})` }} />
}

// Headline words rise into place one after another, each from behind its own line (a "mask" reveal).
export function WordReveal({ lines, delay = 0 }: { lines: ReactNode[][]; delay?: number }) {
  const [on, setOn] = useState(reduced)
  useEffect(() => { const t = setTimeout(() => setOn(true), 60); return () => clearTimeout(t) }, [])
  let k = 0
  return (
    <>
      {lines.map((words, li) => (
        <span key={li} className="block">
          {words.map((w, wi) => {
            const i = k++
            return (
              <span key={wi} className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em] mr-[0.24em] last:mr-0">
                <span className="inline-block transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ transform: on ? 'none' : 'translateY(105%)', transitionDelay: `${delay + i * 70}ms` }}>{w}</span>
              </span>
            )
          })}
        </span>
      ))}
    </>
  )
}

// A number that counts up the first time it scrolls into view.
export function CountUpInView({ to, prefix = '', suffix = '' }: { to: number; prefix?: string; suffix?: string }) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.6)
  const [v, setV] = useState(reduced() ? to : 0)
  useEffect(() => {
    if (!inView || reduced()) return
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1100)
      setV(Math.round(to * (1 - Math.pow(1 - t, 3))))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, to])
  return <span ref={ref} className="tabular-nums">{prefix}{v}{suffix}</span>
}

// One word in the headline that rolls to the next every few seconds (placement → campus → first job → next job).
// The words stack in one slot: the current one sits in place, the old one rolls up and out, the new one rolls in
// from below. The slot is as wide as the widest word, so the headline's layout never changes while words roll.
export function RotatingWord({ words, className = '', every = 2600 }: { words: string[]; className?: string; every?: number }) {
  const [i, setI] = useState(0)
  const [width, setWidth] = useState<number | null>(null)
  const sizers = useRef<(HTMLSpanElement | null)[]>([])
  useEffect(() => {
    if (reduced()) return
    const t = setInterval(() => setI((n) => (n + 1) % words.length), every)
    return () => clearInterval(t)
  }, [words.length, every])
  useLayoutEffect(() => {
    const measure = () => setWidth(Math.max(0, ...sizers.current.map((el) => el?.offsetWidth ?? 0)) || null)
    measure()
    window.addEventListener('resize', measure)
    document.fonts?.ready.then(measure).catch(() => {})
    return () => window.removeEventListener('resize', measure)
  }, [])
  return (
    <span className="relative inline-block align-bottom overflow-hidden h-[1.12em] -mb-[0.04em]"
      style={{ width: width ?? undefined }} aria-live="polite">
      {/* Invisible copies used only to measure each word's width */}
      <span aria-hidden="true" className="absolute invisible whitespace-nowrap">
        {words.map((w, k) => <span key={w} ref={(el) => { sizers.current[k] = el }} className={`inline-block ${className}`}>{w}</span>)}
      </span>
      {words.map((w, k) => {
        const offset = k === i ? 0 : k === (i - 1 + words.length) % words.length ? -1 : 1
        return (
          <span key={w} aria-hidden={k !== i} className={`absolute left-0 top-0 whitespace-nowrap transition-[transform,opacity] duration-450 ease-[cubic-bezier(0.65,0,0.35,1)] ${className}`}
            style={{ transform: `translateY(${offset * 130}%)`, opacity: offset === 0 ? 1 : 0, transitionDuration: offset === 1 ? '0ms' : undefined }}>{w}</span>
        )
      })}
    </span>
  )
}

// Green ticks that draw themselves one after another, each with a soft pulse as it lands.
export function LiveChecks({ items, delay = 0 }: { items: string[]; delay?: number }) {
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2.5 text-sm text-soft">
      {items.map((t, i) => {
        const d = delay + i * 220
        return (
          <li key={t} className="flex items-center gap-2">
            <span className="relative grid place-items-center w-5 h-5 rounded-full bg-good-soft text-good motion-safe:animate-[check-pop_0.5s_cubic-bezier(0.22,1,0.36,1)_both]" style={{ animationDelay: `${d}ms` }}>
              <span aria-hidden="true" className="absolute inset-0 rounded-full bg-good/30 motion-safe:animate-[check-ring_1.1s_ease-out_both] motion-reduce:hidden" style={{ animationDelay: `${d + 250}ms` }} />
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="24" className="motion-safe:animate-[check-draw_0.45s_ease-out_both]" style={{ animationDelay: `${d + 150}ms` }} />
              </svg>
            </span>
            {t}
          </li>
        )
      })}
    </ul>
  )
}

const STATS: { value: number; prefix?: string; suffix?: string; label: string }[] = [
  { value: 19, label: 'job roles, from software to VLSI' },
  { value: 19, label: 'company interview styles' },
  { value: 5, label: 'interview round types' },
  { value: 0, prefix: '₹', label: 'cost, for every student' },
]

function StatBar() {
  const { ref, inView } = useInView<HTMLSpanElement>(0.6)
  return (
    <span ref={ref} aria-hidden="true" className="block h-1 mb-4 mx-auto md:mx-0 w-10 rounded-full bg-linear-to-r from-[#00b8f5] to-[#0b63e5] origin-left transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{ transform: inView ? 'scaleX(1)' : 'scaleX(0)' }} />
  )
}

export function StatsStrip() {
  return (
    <section aria-label="ReadyForRound in numbers" className="px-4 sm:px-6 lg:px-10 py-12 border-b border-line bg-card">
      <dl className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {STATS.map((s) => (
          <div key={s.label} className="flex flex-col-reverse text-center md:text-left md:border-l md:border-line md:pl-6 first:md:border-l-0 first:md:pl-0">
            {/* The label is the term and the number its value; shown number-first */}
            <dt className="text-sm text-muted mt-2">{s.label}</dt>
            <dd className="font-display font-semibold text-4xl sm:text-5xl text-ink">
              <StatBar />
              <CountUpInView to={s.value} prefix={s.prefix} suffix={s.suffix} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

// The product video: it sits tilted back in 3D and settles flat as you scroll to it. Plays with sound on click.
export function ProductVideo() {
  const { ref, p } = useScrollProgress<HTMLDivElement>()
  const video = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const e = 1 - Math.pow(1 - p, 3) // ease-out
  const style = { transform: `perspective(1600px) rotateX(${(1 - e) * 22}deg) scale(${0.86 + 0.14 * e})`, opacity: 0.35 + 0.65 * e }

  function play() {
    const v = video.current
    if (!v) return
    v.controls = true
    v.play().then(() => setPlaying(true)).catch(() => setPlaying(true))
  }

  return (
    <section id="video" aria-label="Product video" className="px-4 sm:px-6 lg:px-10 pt-4 pb-24 scroll-mt-20">
      <div ref={ref} className="max-w-6xl mx-auto origin-top will-change-transform" style={style}>
        <div className="relative rounded-2xl overflow-hidden border border-line bg-card shadow-[0_30px_80px_-20px_rgba(16,24,40,0.25)]">
          <div className="flex items-center gap-1.5 px-4 h-9 border-b border-line bg-raised" aria-hidden="true">
            <span className="w-2.5 h-2.5 rounded-full bg-line-strong" /><span className="w-2.5 h-2.5 rounded-full bg-line-strong" /><span className="w-2.5 h-2.5 rounded-full bg-line-strong" />
            <span className="ml-3 text-xs text-muted">ready-for-round.vercel.app</span>
          </div>
          <video ref={video} src="/video/product.mp4" poster="/video/product-poster.jpg" preload="none" playsInline
            className="block w-full aspect-video bg-paper" onEnded={() => setPlaying(false)}
            aria-label="A 48-second tour of ReadyForRound: mock interview, feedback, Jobs Board, Resume Studio, companies, group discussion and Career Compass" />
          {!playing && (
            <button type="button" onClick={play} aria-label="Play the product video"
              className="group absolute inset-0 top-9 flex items-center justify-center bg-ink/20 hover:bg-ink/10 transition-colors">
              <span className="flex items-center gap-3 rounded-full bg-card/95 pl-2 pr-5 py-2 shadow-lg transition-transform group-hover:scale-[1.03]">
                <span className="w-11 h-11 rounded-full bg-accent text-on-accent grid place-items-center"><Icon name="play" size={18} /></span>
                <span className="text-sm font-semibold text-ink">Watch the 48-second tour</span>
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

const TOUR: { icon: IconName; kicker: string; title: string; text: string; img: string; alt: string }[] = [
  { icon: 'mic', kicker: 'Mock interview', title: 'A real interviewer asks. You answer out loud.', text: 'Questions are shaped for your role, your level and your own resume. Speak your answer or type it, just like a real round.', img: '/tour/interview.webp', alt: 'The interview room: Priya, the AI interviewer, asking a question about the student\'s project' },
  { icon: 'reports', kicker: 'Feedback', title: 'An honest score, and exactly what to fix.', text: 'Every answer gets what went well, what was missing and a stronger way to say it, plus links to learn the gaps.', img: '/tour/feedback.webp', alt: 'A feedback report with a score of 88, what went well and what to work on' },
  { icon: 'trend', kicker: 'Jobs Board', title: 'See what employers want right now.', text: 'Openings, pay and the most asked skills, read from real job ads across India and refreshed every day.', img: '/tour/jobs.webp', alt: 'The Jobs Board leaderboard of roles by number of openings' },
  { icon: 'file', kicker: 'Resume Studio', title: 'Your ATS score before a recruiter sees it.', text: 'Check how your resume reads to hiring systems, which keywords are missing and how well your projects fit the role.', img: '/tour/resume.webp', alt: 'Resume Studio showing an ATS-readiness score and the fixes to make' },
]

// "A closer look": on wide screens the text steps scroll past while the screen beside them stays in place
// and changes to match the step you're reading. Phones get simple stacked cards.
export function Tour() {
  const [active, setActive] = useState(0)
  const list = useRef<HTMLOListElement>(null)
  const [fill, setFill] = useState(0)
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const r = list.current?.getBoundingClientRect()
      if (!r) return
      setFill(Math.min(1, Math.max(0, (window.innerHeight / 2 - r.top) / r.height)))
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [])
  const steps = useRef<(HTMLLIElement | null)[]>([])
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) setActive(Number((en.target as HTMLElement).dataset.i))
    }, { rootMargin: '-45% 0px -45% 0px' })
    steps.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <section id="tour" className="px-4 sm:px-6 lg:px-10 py-20 sm:py-28 scroll-mt-16 border-t border-line">
      <div className="max-w-6xl mx-auto">
        <p className="text-sm font-semibold text-accent-deep">A closer look</p>
        <h2 className="font-display font-semibold text-3xl sm:text-5xl mt-3 max-w-2xl">Everything you need between now and your round.</h2>

        <div className="mt-14 lg:grid lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <ol ref={list} className="relative space-y-6 lg:space-y-0 lg:pl-8">
            <span aria-hidden="true" className="hidden lg:block absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-line">
              <span className="absolute left-0 top-0 w-full rounded-full bg-linear-to-b from-[#00b8f5] to-[#0b63e5]" style={{ height: `${fill * 100}%` }} />
            </span>
            {TOUR.map((s, i) => (
              <li key={s.kicker} ref={(el) => { steps.current[i] = el }} data-i={i} className="lg:min-h-[70vh] lg:flex lg:items-center">
                <div className={`transition-opacity duration-500 ${active === i ? 'lg:opacity-100' : 'lg:opacity-35'}`}>
                  <span className={`inline-flex items-center gap-2 text-sm font-semibold transition-colors duration-500 ${active === i ? 'text-accent-deep' : 'text-muted'}`}>
                    <span className={`w-7 h-7 rounded-lg grid place-items-center transition-colors duration-500 ${active === i ? 'bg-accent text-on-accent' : 'bg-raised text-muted'}`}><Icon name={s.icon} size={15} /></span>
                    {s.kicker}
                  </span>
                  <h3 className="font-display font-semibold text-2xl sm:text-3xl mt-3 leading-tight">{s.title}</h3>
                  <p className="text-soft mt-3 text-[1.05rem] leading-relaxed max-w-md">{s.text}</p>
                  {/* Phones: the screen sits under its own text */}
                  <img src={s.img} alt={s.alt} loading="lazy" className="lg:hidden mt-5 w-full rounded-xl border border-line shadow-sm" />
                </div>
              </li>
            ))}
          </ol>

          <div className="hidden lg:block">
            <div className="sticky top-[calc(50vh-15rem)] h-[30rem]">
              <div className="relative h-full rounded-2xl border border-line bg-card shadow-[0_24px_60px_-24px_rgba(16,24,40,0.25)] overflow-hidden">
                {TOUR.map((s, i) => (
                  <img key={s.img} src={s.img} alt={active === i ? s.alt : ''} aria-hidden={active !== i} loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover object-left-top transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{ opacity: active === i ? 1 : 0, transform: active === i ? 'none' : `translateY(${i < active ? -24 : 24}px) scale(0.98)` }} />
                ))}
              </div>
              <div className="flex justify-center gap-1.5 mt-4" aria-hidden="true">
                {TOUR.map((s, i) => <span key={s.img} className={`h-1.5 rounded-full transition-all duration-500 ${active === i ? 'w-6 bg-accent' : 'w-1.5 bg-line-strong'}`} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
