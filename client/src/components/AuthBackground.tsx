import type { ReactNode } from 'react'

type Item = { left: string; delay: number; duration: number; node: ReactNode; hideOnPhone?: boolean }

const Bubble = ({ children, tint }: { children: ReactNode; tint: string }) => (
  <span className={`inline-block rounded-2xl rounded-bl-sm px-3.5 py-2 text-sm font-medium shadow-sm border border-line/60 ${tint}`}>{children}</span>
)

const Score = ({ n }: { n: number }) => (
  <span className="inline-flex items-center gap-1.5 rounded-xl bg-card border border-line px-3 py-2 shadow-sm">
    <span className="font-display font-semibold text-xl text-good">{n}</span><span className="text-xs text-muted">/ 100</span>
  </span>
)

const Wave = () => (
  <span className="inline-flex items-center gap-2 rounded-full bg-card border border-line px-3 py-2 shadow-sm text-accent">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
    <span className="flex items-end gap-0.5 h-4">
      {[0, 1, 2, 3, 4].map((i) => <span key={i} className="w-0.75 rounded-full bg-current motion-safe:animate-[voice-bar_0.9s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.12}s`, height: '40%' }} />)}
    </span>
  </span>
)

const Tick = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-sage text-sage-ink px-3 py-1.5 text-xs font-semibold shadow-sm">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>{children}
  </span>
)

// Things that float up the screen, like thoughts during an interview: questions, a voice wave, scores, wins.
const ITEMS: Item[] = [
  { left: '4%', delay: 0, duration: 26, node: <Bubble tint="bg-sky text-sky-ink">Tell me about yourself?</Bubble> },
  { left: '72%', delay: -6, duration: 30, node: <Score n={78} /> },
  { left: '18%', delay: -14, duration: 28, node: <Wave />, hideOnPhone: true },
  { left: '82%', delay: -20, duration: 24, node: <Bubble tint="bg-lavender text-lavender-ink">Why this company?</Bubble>, hideOnPhone: true },
  { left: '8%', delay: -9, duration: 32, node: <Tick>Strong STAR answer</Tick>, hideOnPhone: true },
  { left: '64%', delay: -24, duration: 27, node: <Bubble tint="bg-peach text-peach-ink">Explain OOP with an example</Bubble> },
  { left: '30%', delay: -3, duration: 34, node: <Score n={91} />, hideOnPhone: true },
  { left: '76%', delay: -13, duration: 29, node: <Tick>Hired!</Tick> },
  { left: '2%', delay: -19, duration: 25, node: <Bubble tint="bg-blush text-blush-ink">What is a closure?</Bubble>, hideOnPhone: true },
  { left: '56%', delay: -29, duration: 31, node: <Wave /> },
  { left: '86%', delay: -2, duration: 33, node: <span className="inline-flex items-center gap-1.5 rounded-full bg-peach text-peach-ink px-3 py-1.5 text-xs font-semibold shadow-sm">🔥 7-day streak</span>, hideOnPhone: true },
  { left: '40%', delay: -17, duration: 30, node: <Bubble tint="bg-sage text-sage-ink">Walk me through your project</Bubble>, hideOnPhone: true },
]

// A calm, moving backdrop for the login and sign-up pages.
export function AuthBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      {/* Soft colour blobs drifting around */}
      <div className="absolute -top-32 -left-24 w-[34rem] h-[34rem] rounded-full bg-sky opacity-80 blur-3xl motion-safe:animate-[blob-drift_20s_ease-in-out_infinite]" />
      <div className="absolute top-1/3 -right-32 w-[30rem] h-[30rem] rounded-full bg-lavender opacity-80 blur-3xl motion-safe:animate-[blob-drift_24s_ease-in-out_infinite_reverse]" />
      <div className="absolute -bottom-40 left-1/4 w-[28rem] h-[28rem] rounded-full bg-blush opacity-60 blur-3xl motion-safe:animate-[blob-drift_28s_ease-in-out_infinite]" />
      {/* A faint dotted grid, like a calendar or a whiteboard */}
      <div className="absolute inset-0 opacity-[0.35] [background-image:radial-gradient(var(--line-strong)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      {/* Floating interview moments */}
      {ITEMS.map((it, i) => (
        <div key={i} className={`absolute bottom-0 opacity-0 motion-safe:animate-[rise_linear_infinite] ${it.hideOnPhone ? 'max-sm:hidden' : ''}`}
          style={{ left: it.left, animationDuration: `${it.duration}s`, animationDelay: `${it.delay}s` }}>
          <div className="motion-safe:animate-[sway_6s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.7}s` }}>{it.node}</div>
        </div>
      ))}
    </div>
  )
}
