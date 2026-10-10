import { Suspense, useEffect } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router'
import { supabase } from '../lib/supabase'
import { MeProvider, useMe } from '../auth/MeProvider'
import { Button, Icon, type IconName } from '../components/ui'
import { ThemeToggle } from '../components/ThemeToggle'
import { NotificationBell } from '../components/NotificationBell'
import { Brand } from '../components/Brand'
import { openFeedback } from '../components/FeedbackButton'
import { PageSkeleton, ShellSkeleton } from '../components/Skeleton'
import { preloadAppPages } from '../lib/pages'
import { WelcomeTour } from '../components/WelcomeTour'

type NavItem = { to: string; label: string; icon: IconName; live?: boolean; badge?: string } // live: shows real, updating data
const WORKSPACE: NavItem[] = [
  { to: '/home', label: 'Home', icon: 'home' },
  { to: '/practice', label: 'Practice', icon: 'practice' },
  { to: '/gd', label: 'Group discussion', icon: 'chat' },
  { to: '/companies', label: 'Companies', icon: 'building' },
  { to: '/roadmap', label: 'Roadmap', icon: 'map' },
  { to: '/reports', label: 'Reports', icon: 'reports' },
]
// Goals open from the "Current goal" card at the top of the sidebar (and a tab on phones)
const GOALS: NavItem = { to: '/goals', label: 'Goals', icon: 'goals' }
const CAREER: NavItem[] = [
  { to: '/compass', label: 'Career compass', icon: 'compass' },
  { to: '/market', label: 'Jobs Board', icon: 'trend', live: true },
  { to: '/jobs', label: 'Job Readiness', icon: 'target' },
  { to: '/resume', label: 'Resume Studio', icon: 'file', badge: 'New' },
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
  const { me, error, refresh, refreshUsage } = useMe()
  const { pathname } = useLocation()

  // Refresh today's usage whenever the student moves between pages (e.g. back from an interview).
  useEffect(() => { refreshUsage() }, [pathname, refreshUsage])
  // Once the app is open, fetch the other pages quietly so clicking around feels instant
  useEffect(() => { preloadAppPages() }, [])

  if (error) return <LoadError message={error} onRetry={refresh} />
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
      <main className="app-shell flex-1 min-w-0 px-4 sm:px-8 lg:px-10 pt-4 lg:pt-16 pb-28 lg:pb-10">
        <MobileTopBar />
        <div className="max-w-7xl 2xl:max-w-[96rem] mx-auto">
          {/* The sidebar stays put while a page's code downloads */}
          <Suspense fallback={<PageSkeleton />}>
            {/* Each new page fades and rises in */}
            <div key={pathname} className="page-in">
              <Outlet />
            </div>
          </Suspense>
        </div>
      </main>
      <MobileNav />
      {pathname === '/home' && <WelcomeTour userId={me.id} firstName={(me.full_name ?? '').split(' ')[0]} />}
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

      <Link to="/goals" data-tour="goal" className="group flex items-center gap-2.5 min-h-14 px-3 py-2.5 rounded-xl bg-raised border border-line hover:border-line-strong transition-colors">
        <span className={`w-2 h-2 shrink-0 rounded-full ${goal ? 'bg-accent' : 'bg-warn'}`} />
        <span className="flex-1 min-w-0">
          <span className="block text-xs font-semibold tracking-[0.14em] text-muted">Current goal</span>
          <span className="block text-sm font-semibold truncate">{goal ? label('roles', goal.target_role) : 'Choose a goal'}</span>
          {goal && <span className="block text-xs text-muted truncate">{label('companyTypes', goal.company_type)}</span>}
        </span>
        <Icon name="swap" size={16} className="text-muted group-hover:text-ink" />
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
          <span className="w-9 h-9 shrink-0 rounded-full bg-accent-soft text-accent-deep text-sm font-semibold flex items-center justify-center">{initials}</span>
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
      <span className="text-xs font-semibold tracking-[0.16em] text-subtle px-2.5 pb-1.5">{title}</span>
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} data-tour={it.to.slice(1)}
          className={({ isActive }) => `flex items-center gap-3 min-h-9 px-2.5 rounded-lg text-sm transition-colors ${isActive
            ? 'bg-accent-soft text-accent-deep font-semibold'
            : 'text-soft hover:text-ink hover:bg-raised'}`}>
          {({ isActive }) => (
            <>
              <Icon name={it.icon} size={17} strokeWidth={isActive ? 2.1 : 1.8} className={isActive ? '' : 'text-muted'} />
              <span>{it.label}</span>
              {it.badge && (
                <span className="ml-auto rounded-md bg-accent-soft text-accent-deep px-1.5 py-px text-[10px] font-semibold">{it.badge}</span>
              )}
              {it.live && (
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-good" title="Updated daily from real job ads">
                  <span className="w-1.5 h-1.5 rounded-full bg-good" /> Live
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
        <span className="tabular-nums">{usage.interviews.used} / {usage.interviews.limit}</span>
      </div>
      <div className="h-1.5 rounded-full bg-hover overflow-hidden"><div className={`h-full rounded-full ${pct >= 100 ? 'bg-warn' : 'bg-accent'}`} style={{ width: `${pct}%` }} /></div>
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
        <Link to="/profile" aria-label="Profile" className="w-9 h-9 rounded-full bg-accent-soft text-accent-deep text-xs font-semibold flex items-center justify-center">{initials}</Link>
      </div>
    </div>
  )
}

function MobileNav() {
  // Phones have room for six tabs: the workspace pages (Group discussion is on the Practice page) and Goals
  const tabs = [...WORKSPACE.filter((t) => t.to !== '/gd'), GOALS]
  return (
    <nav aria-label="Main" className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-card/95 backdrop-blur border-t border-line grid grid-cols-6 px-0.5 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} data-tour={t.to.slice(1)}
          className={({ isActive }) => `flex flex-col items-center justify-center gap-1 min-h-12 text-[10px] tracking-tight ${isActive ? 'text-ink font-semibold' : 'text-muted'}`}>
          {({ isActive }) => (
            <>
              <span className={`w-11 h-7 rounded-full grid place-items-center transition-colors ${isActive ? 'bg-accent-soft text-accent-deep' : ''}`}>
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

// Shown when the account can't be loaded (server busy, offline, or the account no longer exists)
function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <main className="min-h-screen grid place-items-center p-4">
      <div className="max-w-sm w-full bg-card border border-line rounded-3xl p-7 text-center shadow-sm">
        <Brand />
        <h1 className="font-display font-bold text-xl text-ink mt-6">We couldn't load your account</h1>
        <p className="text-sm text-muted mt-2">{message}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={onRetry}>Try again</Button>
          <Button variant="secondary" onClick={() => supabase.auth.signOut()}>Log out</Button>
        </div>
      </div>
    </main>
  )
}
