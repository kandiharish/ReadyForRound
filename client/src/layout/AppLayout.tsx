import { Suspense, useEffect } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router'
import { supabase } from '../lib/supabase'
import { MeProvider, useMe } from '../auth/MeProvider'
import { Icon, type IconName } from '../components/ui'
import { ThemeToggle } from '../components/ThemeToggle'
import { NotificationBell } from '../components/NotificationBell'
import { Brand } from '../components/Brand'
import { openFeedback } from '../components/FeedbackButton'
import { PageSkeleton, ShellSkeleton } from '../components/Skeleton'
import { preloadAppPages } from '../lib/pages'

// Each page has its own soft colour: a small icon tile, a tinted row when it's the open page,
// and a solid tile when active. Full class names are written out so Tailwind can find them.
type Tone = { tile: string; row: string; solid: string }
const TONES = {
  sky: { tile: 'bg-sky text-sky-ink', row: 'bg-sky', solid: 'bg-sky-ink text-card' },
  blush: { tile: 'bg-blush text-blush-ink', row: 'bg-blush', solid: 'bg-blush-ink text-card' },
  peach: { tile: 'bg-peach text-peach-ink', row: 'bg-peach', solid: 'bg-peach-ink text-card' },
  sage: { tile: 'bg-sage text-sage-ink', row: 'bg-sage', solid: 'bg-sage-ink text-card' },
  lavender: { tile: 'bg-lavender text-lavender-ink', row: 'bg-lavender', solid: 'bg-lavender-ink text-card' },
  amber: { tile: 'bg-warn-soft text-warn', row: 'bg-warn-soft', solid: 'bg-warn text-card' },
  teal: { tile: 'bg-info-soft text-info', row: 'bg-info-soft', solid: 'bg-info text-card' },
  green: { tile: 'bg-good-soft text-good', row: 'bg-good-soft', solid: 'bg-good text-card' },
  blue: { tile: 'bg-accent-soft text-accent-deep', row: 'bg-accent-soft', solid: 'bg-accent text-on-accent' },
  grey: { tile: 'bg-raised text-soft', row: 'bg-raised', solid: 'bg-soft text-card' },
} satisfies Record<string, Tone>

type NavItem = { to: string; label: string; icon: IconName; tone: Tone; shine?: boolean; badge?: string } // shine: a highlighted, "live" page
const WORKSPACE: NavItem[] = [
  { to: '/home', label: 'Home', icon: 'home', tone: TONES.sky },
  { to: '/practice', label: 'Practice', icon: 'practice', tone: TONES.blush },
  { to: '/gd', label: 'Group discussion', icon: 'chat', tone: TONES.amber },
  { to: '/companies', label: 'Companies', icon: 'building', tone: TONES.peach },
  { to: '/roadmap', label: 'Roadmap', icon: 'map', tone: TONES.sage },
  { to: '/reports', label: 'Reports', icon: 'reports', tone: TONES.lavender },
]
const CAREER: NavItem[] = [
  { to: '/goals', label: 'Goals', icon: 'goals', tone: TONES.amber },
  { to: '/compass', label: 'Career compass', icon: 'compass', tone: TONES.teal },
  { to: '/market', label: 'Jobs Board', icon: 'trend', tone: TONES.green, shine: true },
  { to: '/jobs', label: 'Job Readiness', icon: 'file', tone: TONES.lavender, badge: 'New' },
]
// Profile and Settings live in the account row at the bottom of the sidebar (and the top bar on phones).

// The frame around every signed-in page: sidebar on desktop, tab bar on phones, the page in the middle.
export default function AppLayout() {
  return (
    <MeProvider>
      <Shell />
    </MeProvider>
  )
}

function Shell() {
  const { me, error, refreshUsage } = useMe()
  const { pathname } = useLocation()

  // Refresh today's usage whenever the student moves between pages (e.g. back from an interview).
  useEffect(() => { refreshUsage() }, [pathname, refreshUsage])
  // Once the app is open, fetch the other pages quietly so clicking around feels instant
  useEffect(() => { preloadAppPages() }, [])

  if (error) return <main className="min-h-screen p-8 text-bad">{error}</main>
  if (!me) return <ShellSkeleton />
  if (!me.onboarding_completed) return <Navigate to="/onboarding" replace />

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      {/* Desktop: notifications and the light/dark switch in the top-right corner */}
      <div className="hidden lg:flex fixed top-5 right-5 z-30 items-center gap-2">
        <NotificationBell />
        <ThemeToggle />
      </div>
      <main className="flex-1 min-w-0 px-4 sm:px-8 lg:px-10 pt-4 lg:pt-16 pb-28 lg:pb-10">
        <MobileTopBar />
        <div className="max-w-7xl 2xl:max-w-[96rem] mx-auto">
          {/* The sidebar stays put while a page's code downloads */}
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <MobileNav />
    </div>
  )
}

function Sidebar() {
  const { me, label } = useMe()
  const goal = me?.active_goal
  const initials = (me?.full_name ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <nav aria-label="Main" className="hidden lg:flex flex-col gap-4 w-62 shrink-0 h-screen sticky top-0 bg-card border-r border-line px-3.5 py-5">
      <Link to="/home" className="px-2" aria-label="ReadyForRound home">
        <Brand />
      </Link>

      <Link to="/goals" className="group flex items-center gap-2.5 min-h-14 px-3 py-2.5 rounded-xl bg-linear-to-br from-lavender to-sky border border-lavender-ink/15 hover:shadow-md hover:-translate-y-px transition-all">
        <span className="relative flex w-2.5 h-2.5 shrink-0">
          {goal && <span className="absolute inset-0 rounded-full bg-accent/40 animate-ping motion-reduce:hidden" />}
          <span className={`relative w-2.5 h-2.5 rounded-full ${goal ? 'bg-accent' : 'bg-warn'}`} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-lavender-ink">Current goal</span>
          <span className="block text-sm font-semibold truncate">{goal ? label('roles', goal.target_role) : 'Choose a goal'}</span>
          {goal && <span className="block text-xs text-muted truncate">{label('companyTypes', goal.company_type)}</span>}
        </span>
        <Icon name="swap" size={16} className="text-lavender-ink/70 group-hover:text-lavender-ink" />
      </Link>

      {/* The page list scrolls on short screens, so the usage card and profile below always stay visible */}
      <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] -mx-1 px-1 flex flex-col gap-4">
        <NavGroup title="Workspace" items={WORKSPACE} />
        <NavGroup title="Placements Hub" items={CAREER} />
      </div>

      <UsageCard />

      <div className="flex items-center gap-1 px-0.5">
        <NavLink to="/profile" title="Your profile"
          className={({ isActive }) => `flex-1 min-w-0 flex items-center gap-2.5 rounded-xl p-1 transition-colors ${isActive ? 'bg-accent-soft' : 'hover:bg-raised'}`}>
          <span className="w-9 h-9 shrink-0 rounded-full bg-linear-to-br from-peach to-blush text-blush-ink text-sm font-bold flex items-center justify-center ring-2 ring-card shadow-sm">{initials}</span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold truncate">{me?.full_name}</span>
            <span className="block text-xs text-muted truncate">{label('experienceLevels', me?.experience_level)}</span>
          </span>
        </NavLink>
        <NavLink to="/settings" aria-label="Settings" title="Settings"
          className={({ isActive }) => `w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${isActive ? 'bg-raised text-ink' : 'text-muted hover:text-ink hover:bg-raised'}`}>
          <Icon name="settings" size={17} />
        </NavLink>
        <button type="button" onClick={() => supabase.auth.signOut()} aria-label="Log out"
          className="w-9 h-9 shrink-0 rounded-lg text-muted hover:text-ink hover:bg-raised flex items-center justify-center">
          <Icon name="logout" size={17} />
        </button>
      </div>
    </nav>
  )
}

function NavGroup({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle px-2.5 pb-1.5">{title}</span>
      {items.map((it) => (
        <NavLink key={it.to} to={it.to}
          className={({ isActive }) => `group relative overflow-hidden flex items-center gap-3 min-h-9 px-2 rounded-xl text-sm transition-colors ${isActive
            ? `${it.tone.row} text-ink font-semibold`
            : it.shine ? 'text-ink font-medium bg-linear-to-r from-good-soft via-card to-good-soft/40 ring-1 ring-good/25 hover:ring-good/50'
              : 'text-soft hover:text-ink hover:bg-raised'}`}>
          {({ isActive }) => (
            <>
              {/* A light sweep across the row draws the eye to a live page */}
              {it.shine && !isActive && <span aria-hidden="true" className="nav-shine pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 motion-reduce:hidden" />}
              <span className={`relative w-7 h-7 rounded-lg grid place-items-center shrink-0 transition-all ${isActive ? `${it.tone.solid} shadow-sm` : `${it.tone.tile} group-hover:scale-105`}`}>
                <Icon name={it.icon} size={16} strokeWidth={isActive ? 2.1 : 1.9} />
              </span>
              <span className="relative">{it.label}</span>
              {it.badge && !it.shine && (
                <span className="relative ml-auto rounded-full border border-bad/30 bg-bad-soft text-bad px-2 py-px text-[10px] font-semibold">{it.badge}</span>
              )}
              {it.shine && (
                <span className="relative ml-auto inline-flex items-center gap-1 rounded-full bg-good text-white px-1.5 py-0.5 text-[9px] font-bold tracking-wider">
                  <span className="relative flex w-1.5 h-1.5"><span className="absolute inset-0 rounded-full bg-white/80 animate-ping motion-reduce:hidden" /><span className="relative w-1.5 h-1.5 rounded-full bg-white" /></span>
                  LIVE
                </span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </div>
  )
}

// Today's interviews and drills against the daily limit.
function UsageCard() {
  const { usage } = useMe()
  if (!usage) return null
  const pct = Math.min(100, (usage.interviews.used / usage.interviews.limit) * 100)
  return (
    <div className="rounded-xl bg-raised border border-line px-3 py-2.5 space-y-1.5" title={`Drills ${usage.drills.used} / ${usage.drills.limit} · resets at midnight`}>
      <div className="flex justify-between text-xs">
        <span className="text-muted">Today's interviews</span>
        <span className="font-mono">{usage.interviews.used} / {usage.interviews.limit}</span>
      </div>
      <div className="h-1.5 rounded-full bg-hover overflow-hidden"><div className={`h-full rounded-full ${pct >= 100 ? 'bg-warn' : 'bg-linear-to-r from-[#12a8f0] to-[#7b3cf0]'}`} style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

// Phones: logo, the light/dark switch, and quick links to Settings and Profile (the bottom bar has room for five tabs only).
function MobileTopBar() {
  const { me } = useMe()
  const initials = (me?.full_name ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="lg:hidden flex items-center justify-between mb-4">
      <Link to="/home" aria-label="ReadyForRound home">
        <Brand size="sm" collapse />
      </Link>
      <div className="flex items-center gap-1">
        <button type="button" onClick={openFeedback} aria-label="Send feedback"
          className="w-10 h-10 rounded-full bg-card border border-line-strong text-ink shadow-sm hover:border-accent flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></svg>
        </button>
        <NotificationBell />
        <ThemeToggle />
        <Link to="/settings" aria-label="Settings" className="w-11 h-11 rounded-xl text-muted hover:text-ink flex items-center justify-center"><Icon name="settings" /></Link>
        <Link to="/profile" aria-label="Profile" className="w-9 h-9 rounded-full bg-linear-to-br from-peach to-blush text-blush-ink text-xs font-bold flex items-center justify-center">{initials}</Link>
      </div>
    </div>
  )
}

function MobileNav() {
  // Phones have room for six tabs: the workspace pages (Group discussion is on the Practice page) and Goals
  const tabs = [...WORKSPACE.filter((t) => t.to !== '/gd'), CAREER[0]]
  return (
    <nav aria-label="Main" className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-card/95 backdrop-blur border-t border-line grid grid-cols-6 px-0.5 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to}
          className={({ isActive }) => `flex flex-col items-center justify-center gap-1 min-h-12 text-[10px] tracking-tight ${isActive ? 'text-ink font-semibold' : 'text-muted'}`}>
          {({ isActive }) => (
            <>
              <span className={`w-11 h-7 rounded-full grid place-items-center transition-colors ${isActive ? t.tone.tile : ''}`}>
                <Icon name={t.icon} size={20} strokeWidth={isActive ? 2.1 : 1.8} />
              </span>
              {t.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
