import { Link, Navigate, NavLink, Outlet } from 'react-router'
import { supabase } from '../lib/supabase'
import { MeProvider, useMe } from '../auth/MeProvider'
import { Icon, Spinner, type IconName } from '../components/ui'

const WORKSPACE: { to: string; label: string; icon: IconName }[] = [
  { to: '/home', label: 'Home', icon: 'home' },
  { to: '/practice', label: 'Practice', icon: 'practice' },
  { to: '/reports', label: 'Reports', icon: 'reports' },
]
const CAREER: { to: string; label: string; icon: IconName }[] = [
  { to: '/goals', label: 'Goals', icon: 'goals' },
  { to: '/profile', label: 'Profile', icon: 'profile' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]

// The frame around every signed-in page: sidebar on desktop, tab bar on phones, the page in the middle.
export default function AppLayout() {
  return (
    <MeProvider>
      <Shell />
    </MeProvider>
  )
}

function Shell() {
  const { me, error } = useMe()

  if (error) return <main className="min-h-screen p-8 text-rose">{error}</main>
  if (!me) return <main className="min-h-screen p-8"><Spinner /></main>
  if (!me.onboarding_completed) return <Navigate to="/onboarding" replace />

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 sm:px-8 lg:px-10 pt-6 lg:pt-8 pb-28 lg:pb-10">
        <div className="max-w-6xl mx-auto">
          <Outlet />
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
    <nav aria-label="Main" className="hidden lg:flex flex-col gap-5 w-62 shrink-0 h-screen sticky top-0 bg-ink-850 border-r border-line px-3.5 py-5">
      <Link to="/home" className="flex items-center gap-2.5 px-2 text-fg">
        <span className="w-8 h-8 rounded-lg bg-lime text-ink-900 flex items-center justify-center"><Icon name="logo" size={18} strokeWidth={2.4} /></span>
        <span className="font-semibold tracking-tight">ReadyForRound</span>
      </Link>

      <Link to="/goals" className="flex items-center gap-2.5 min-h-14 px-3 rounded-xl bg-ink-750 border border-line-strong hover:border-muted">
        <span className={`w-2 h-2 rounded-full shrink-0 ${goal ? 'bg-lime' : 'bg-amber'}`} />
        <span className="flex-1 min-w-0">
          <span className="block text-[11px] uppercase tracking-wider text-muted">Current goal</span>
          <span className="block text-sm font-semibold truncate">{goal ? label('roles', goal.target_role) : 'Choose a goal'}</span>
          {goal && <span className="block text-xs text-muted truncate">{label('companyTypes', goal.company_type)}</span>}
        </span>
        <Icon name="swap" size={16} className="text-muted" />
      </Link>

      <NavGroup title="Workspace" items={WORKSPACE} />
      <NavGroup title="Career" items={CAREER} />

      <div className="flex-1" />

      <div className="flex items-center gap-2.5 px-1.5">
        <span className="w-9 h-9 rounded-full bg-ink-700 text-lime text-sm font-semibold flex items-center justify-center">{initials}</span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold truncate">{me?.full_name}</span>
          <span className="block text-xs text-muted">{label('experienceLevels', me?.experience_level)}</span>
        </span>
        <button type="button" onClick={() => supabase.auth.signOut()} aria-label="Log out"
          className="w-9 h-9 rounded-lg text-muted hover:text-fg hover:bg-ink-750 flex items-center justify-center">
          <Icon name="logout" size={17} />
        </button>
      </div>
    </nav>
  )
}

function NavGroup({ title, items }: { title: string; items: typeof WORKSPACE }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-widest text-subtle px-2.5 pb-1.5">{title}</span>
      {items.map((it) => (
        <NavLink key={it.to} to={it.to}
          className={({ isActive }) => `flex items-center gap-3 min-h-10 px-2.5 rounded-lg text-sm transition-colors ${isActive
            ? 'bg-ink-700 text-white font-semibold shadow-[inset_2px_0_0_var(--color-lime)]'
            : 'text-soft hover:text-fg hover:bg-ink-750'}`}>
          <Icon name={it.icon} />
          {it.label}
        </NavLink>
      ))}
    </div>
  )
}

function MobileNav() {
  const tabs = [...WORKSPACE, CAREER[0], CAREER[1]]
  return (
    <nav aria-label="Main" className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-ink-850/95 backdrop-blur border-t border-line grid grid-cols-5 px-1 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to}
          className={({ isActive }) => `flex flex-col items-center justify-center gap-1 min-h-12 text-[11px] ${isActive ? 'text-lime font-semibold' : 'text-muted'}`}>
          <Icon name={t.icon} size={20} />
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
