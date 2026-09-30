import type { ReactNode } from 'react'
import { Link } from 'react-router'

// Shared building blocks, so every page looks and behaves the same.

const ICONS = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  practice: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
  reports: 'M4 20V11M10 20V5M16 20v-6M21 20H3',
  goals: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  settings: 'M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1M15 4v4M9 10v4M17 16v4',
  play: 'M8 5v14l11-7z',
  plus: 'M12 5v14M5 12h14',
  up: 'M5 15l7-7 7 7',
  down: 'M5 9l7 7 7-7',
  check: 'M5 12l5 5L20 7',
  flame: 'M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.5 2 1.5 3 3 3-1-3 0-6 0-8.5z',
  logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  logo: 'M4 17l5-5 4 4 7-8M15 8h5v5',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19a2 2 0 0 1 2-2h13',
  alert: 'M12 8v5M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  swap: 'M7 9l5-5 5 5M7 15l5 5 5-5',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3',
} as const

export type IconName = keyof typeof ICONS

export function Icon({ name, size = 18, className = '', strokeWidth = 1.8 }: { name: IconName; size?: number; className?: string; strokeWidth?: number }) {
  const filled = name === 'play'
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}
      fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[name]} />
    </svg>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`bg-ink-800 border border-line rounded-2xl p-5 sm:p-6 ${className}`}>{children}</section>
}

const BUTTON = {
  primary: 'bg-lime text-ink-900 hover:bg-lime-hover font-semibold',
  secondary: 'bg-ink-750 text-fg border border-line-strong hover:bg-ink-700 font-medium',
  ghost: 'text-muted hover:text-fg hover:bg-ink-750 font-medium',
  dark: 'bg-ink-900 text-white hover:bg-black font-semibold',
} as const

type ButtonProps = { variant?: keyof typeof BUTTON; className?: string; children: ReactNode }

export function Button({ variant = 'primary', className = '', children, ...rest }: ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} className={`inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${BUTTON[variant]} ${className}`}>
      {children}
    </button>
  )
}

export function ButtonLink({ to, variant = 'primary', className = '', children }: ButtonProps & { to: string }) {
  return (
    <Link to={to} className={`inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-xl text-sm transition-colors ${BUTTON[variant]} ${className}`}>
      {children}
    </Link>
  )
}

export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="text-sm text-muted">{eyebrow}</p>}
        <h1 className="font-display text-4xl sm:text-5xl leading-none mt-1">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-2 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </header>
  )
}

// Score colour: good (lime), needs work (amber), low (rose). Also differs in lightness, not only hue.
export const scoreTone = (score: number) => (score >= 70 ? 'lime' : score >= 40 ? 'amber' : 'rose')
const TONE_HEX = { lime: '#c6f36b', amber: '#f5b85a', rose: '#ff8a95', sky: '#7dd3fc' }

export function ScoreRing({ value, size = 140, label = 'ready', suffix = '%', color }: { value: number | null; size?: number; label?: string; suffix?: string; color?: keyof typeof TONE_HEX }) {
  const r = 42
  const c = 2 * Math.PI * r
  const stroke = TONE_HEX[color ?? (value === null ? 'lime' : scoreTone(value))]
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#232838" strokeWidth="8" />
        {value !== null && (
          <circle cx="50" cy="50" r={r} fill="none" stroke={stroke} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(100, value)) / 100)} />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono font-semibold tracking-tight" style={{ fontSize: size * 0.24 }}>{value === null ? '—' : `${value}${suffix}`}</span>
        {label && <span className="text-xs text-muted">{label}</span>}
      </div>
    </div>
  )
}

export function Bar({ value, tone }: { value: number; tone?: 'lime' | 'amber' | 'rose' | 'sky' }) {
  const color = { lime: 'bg-lime', amber: 'bg-amber', rose: 'bg-rose', sky: 'bg-sky' }[tone ?? scoreTone(value)]
  return (
    <div className="h-1.5 rounded-full bg-[#232838] overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

export function ScoreChip({ score, outOf = 100 }: { score: number; outOf?: number }) {
  const tone = scoreTone((score / outOf) * 100)
  const cls = { lime: 'bg-lime-deep text-lime', amber: 'bg-amber-deep text-amber', rose: 'bg-rose-deep text-rose' }[tone]
  return <span className={`inline-block font-mono text-sm font-semibold rounded-full px-3 py-0.5 ${cls}`}>{score}{outOf === 10 ? '/10' : ''}</span>
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-muted text-sm" role="status">
      <span className="w-5 h-5 rounded-full border-2 border-line-strong border-t-lime animate-spin" />
      {label}
    </div>
  )
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <Card className="text-center py-12">
      <p className="font-display text-3xl">{title}</p>
      <p className="text-sm text-muted mt-2 max-w-md mx-auto">{body}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </Card>
  )
}

// Options shown as selectable cards (used by onboarding and forms).
export function ChoiceCards<T extends string>({ options, value, onChange, columns = 1 }: {
  options: readonly { id: T; label: string; description?: string }[]
  value: T | null
  onChange: (id: T) => void
  columns?: 1 | 2
}) {
  return (
    <div className={`grid gap-2 ${columns === 2 ? 'sm:grid-cols-2' : ''}`}>
      {options.map((o) => (
        <button key={o.id} type="button" onClick={() => onChange(o.id)} aria-pressed={value === o.id}
          className={`text-left rounded-xl border px-4 py-3 transition-colors ${value === o.id
            ? 'border-lime bg-lime-deep ring-1 ring-lime' : 'border-line-strong bg-ink-750 hover:border-muted'}`}>
          <span className="font-medium text-fg">{o.label}</span>
          {o.description && <span className="block text-sm text-muted mt-0.5">{o.description}</span>}
        </button>
      ))}
    </div>
  )
}
