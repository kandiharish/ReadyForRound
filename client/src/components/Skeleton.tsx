import type { CSSProperties, ReactNode } from 'react'

// Skeleton loading: grey shapes in the layout of the real page, with a soft shine moving across.
// It feels faster than a spinner because people see the page "arriving".

// One placeholder shape. Size it with Tailwind classes, e.g. <Bone className="h-4 w-40" />.
export function Bone({ className = '', stage = false, style }: { className?: string; stage?: boolean; style?: CSSProperties }) {
  return <span aria-hidden="true" style={style} className={`skeleton ${stage ? 'skeleton-stage' : ''} block rounded-full ${className}`} />
}

// Wraps a skeleton so screen readers hear "Loading" once instead of nothing.
function Loading({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}

// Text lines of slightly different lengths (looks like real text).
const WIDTHS = ['92%', '78%', '86%', '64%', '90%', '72%', '82%', '58%']
export function Lines({ count = 3, className = '', stage = false }: { count?: number; className?: string; stage?: boolean }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <Bone key={i} stage={stage} className="h-3.5" style={{ width: WIDTHS[i % WIDTHS.length] }} />
      ))}
    </div>
  )
}

function CardBones({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`rounded-2xl bg-card border border-line p-5 sm:p-6 ${className}`}>
      <div className="flex items-center gap-3">
        <Bone className="h-10 w-10 rounded-xl" />
        <Bone className="h-4 w-36" />
      </div>
      <Lines count={lines} className="mt-5" />
    </div>
  )
}

function HeaderBones() {
  return (
    <div className="space-y-3">
      <Bone className="h-3 w-24" />
      <Bone className="h-9 sm:h-11 w-72 max-w-full rounded-xl" />
      <Bone className="h-3.5 w-96 max-w-full" />
    </div>
  )
}

// A typical page: title, then a grid of cards.
export function PageSkeleton({ label = 'Loading' }: { label?: string }) {
  return (
    <Loading label={label} className="space-y-6">
      <HeaderBones />
      <div className="grid gap-5 lg:grid-cols-3">
        <CardBones lines={4} />
        <CardBones lines={4} />
        <CardBones lines={4} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <CardBones lines={3} />
        <CardBones lines={3} />
      </div>
    </Loading>
  )
}

// A list page (reports, practice questions).
export function ListSkeleton({ rows = 6, label = 'Loading', header = true }: { rows?: number; label?: string; header?: boolean }) {
  return (
    <Loading label={label} className="space-y-6">
      {header && <HeaderBones />}
      <div className="rounded-2xl bg-card border border-line divide-y divide-line">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 sm:p-5">
            <Bone className="h-10 w-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2.5">
              <Bone className="h-3.5" style={{ width: WIDTHS[i % WIDTHS.length] }} />
              <Bone className="h-3 w-32" />
            </div>
            <Bone className="h-7 w-12 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </Loading>
  )
}

// A grid of tiles (companies, features).
export function TilesSkeleton({ count = 6, label = 'Loading' }: { count?: number; label?: string }) {
  return (
    <Loading label={label} className="space-y-6">
      <HeaderBones />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: count }, (_, i) => <CardBones key={i} lines={2} />)}
      </div>
    </Loading>
  )
}

// Home dashboard: greeting, quote, story circles, three cards.
export function HomeSkeleton() {
  return (
    <Loading label="Loading your dashboard" className="space-y-6">
      <div className="space-y-3">
        <Bone className="h-3 w-32" />
        <Bone className="h-10 sm:h-12 w-80 max-w-full rounded-xl" />
      </div>
      <Bone className="h-24 w-full rounded-2xl" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="shrink-0 flex flex-col items-center gap-2">
            <Bone className="h-[70px] w-[70px]" />
            <Bone className="h-2.5 w-14" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr_0.85fr]">
        <CardBones lines={5} />
        <CardBones lines={4} />
        <CardBones lines={4} />
      </div>
    </Loading>
  )
}

// The app shell (sidebar + content) while the profile loads.
export function ShellSkeleton() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-col gap-5 w-62 shrink-0 h-screen bg-card border-r border-line px-3.5 py-5">
        <Bone className="h-8 w-40 rounded-lg" />
        <Bone className="h-14 w-full rounded-xl" />
        <div className="space-y-4 mt-2">
          {Array.from({ length: 8 }, (_, i) => <Bone key={i} className="h-4" style={{ width: `${60 + ((i * 13) % 30)}%` }} />)}
        </div>
      </div>
      <main className="flex-1 min-w-0 px-4 sm:px-8 lg:px-10 pt-6 lg:pt-16">
        <div className="max-w-7xl mx-auto"><PageSkeleton /></div>
      </main>
    </div>
  )
}

// The interview room while it opens (uses the room's colours).
export function RoomSkeleton() {
  return (
    <Loading label="Opening your interview" className="h-[100dvh] sm:min-h-screen bg-stage flex flex-col p-4 gap-3">
      <div className="flex items-center justify-between">
        <Bone stage className="h-7 w-28 rounded-lg" />
        <Bone stage className="h-3.5 w-40" />
        <Bone stage className="h-3.5 w-12" />
      </div>
      <div className="flex-1 min-h-40 rounded-2xl bg-stage-card flex items-center justify-center">
        <Bone stage className="w-[min(14rem,26dvh)] h-[min(14rem,26dvh)] sm:w-72 sm:h-72" />
      </div>
      <div className="rounded-xl bg-stage-card border border-stage-line p-4">
        <Bone stage className="h-3 w-20" />
        <Lines stage count={2} className="mt-3" />
      </div>
      <div className="flex justify-center gap-2 pb-2">
        <Bone stage className="h-12 w-48" />
        <Bone stage className="h-12 w-12" />
        <Bone stage className="h-12 w-12" />
        <Bone stage className="h-12 w-20" />
      </div>
    </Loading>
  )
}

// A feedback report being prepared: score ring and sections.
export function ReportSkeleton() {
  return (
    <div className="space-y-5" aria-hidden="true">
      <div className="rounded-2xl bg-card border border-line p-6 flex flex-col sm:flex-row gap-6 items-center">
        <Bone className="h-28 w-28 shrink-0" />
        <Lines count={3} className="flex-1 w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <CardBones lines={3} />
        <CardBones lines={3} />
      </div>
    </div>
  )
}
