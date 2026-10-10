import { lazy, type ComponentType } from 'react'

// Every page is its own small file that downloads only when it's first opened, so the first visit is fast.
// After the app shell appears, preloadAppPages() fetches the rest quietly, so later clicks feel instant.

type Loader = () => Promise<{ default: ComponentType }>
const loaders: Loader[] = []

// After a new release the old page files are gone: reload once to pick up the new version.
function withReload(load: Loader): Loader {
  return () => load().catch((err) => {
    const key = 'rfr-reloaded-for-update'
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1')
      window.location.reload()
      return new Promise<never>(() => {})
    }
    throw err
  })
}

function page(load: Loader, preload = true) {
  const safe = withReload(load)
  if (preload) loaders.push(safe)
  return lazy(safe)
}
// Named exports (several pages in one file)
function named<M>(load: () => Promise<M>, pick: (m: M) => ComponentType, preload = true) {
  return page(() => load().then((m) => ({ default: pick(m) })), preload)
}

export function preloadAppPages() {
  sessionStorage.removeItem('rfr-reloaded-for-update')
  const run = () => loaders.forEach((l) => void l().catch(() => {}))
  // Wait a moment first: the browser counts "waiting for the network" as idle, and the open page's own data comes first
  const later = () => ('requestIdleCallback' in window ? requestIdleCallback(run, { timeout: 4000 }) : run())
  setTimeout(later, 2500)
}

// Public pages: loaded on demand only
export const Landing = page(() => import('../pages/Landing'), false)
export const Login = page(() => import('../pages/Login'), false)
export const Signup = page(() => import('../pages/Signup'), false)
export const ForgotPassword = page(() => import('../pages/ForgotPassword'), false)
export const ResetPassword = page(() => import('../pages/ResetPassword'), false)
export const Status = page(() => import('../pages/Status'), false)
export const PrivacyPage = named(() => import('../pages/Legal'), (m) => m.PrivacyPage, false)
export const TermsPage = named(() => import('../pages/Legal'), (m) => m.TermsPage, false)
export const Onboarding = page(() => import('../pages/Onboarding'), false)

// App pages: preloaded in the background once the app is open
export const Home = page(() => import('../pages/Home'))
export const Practice = page(() => import('../pages/Practice'))
export const Reports = page(() => import('../pages/Reports'))
export const ReportPage = page(() => import('../pages/ReportPage'))
export const Goals = page(() => import('../pages/Goals'))
export const Roadmap = page(() => import('../pages/Roadmap'))
export const ProfilePage = page(() => import('../pages/ProfilePage'))
export const Settings = page(() => import('../pages/Settings'))
export const InterviewRoom = page(() => import('../pages/InterviewRoom'))
export const Companies = page(() => import('../pages/Companies'))
export const CompanyPage = page(() => import('../pages/CompanyPage'))
export const Compass = page(() => import('../pages/Compass'))
export const Market = page(() => import('../pages/Market'))
export const MarketRolePage = named(() => import('../pages/Market'), (m) => m.MarketRolePage)
export const Jobs = page(() => import('../pages/Jobs'))
export const JobPage = named(() => import('../pages/Jobs'), (m) => m.JobPage)
export const GdHome = page(() => import('../pages/Gd'))
export const GdRoom = named(() => import('../pages/Gd'), (m) => m.GdRoom)
export const ResumeStudio = page(() => import('../pages/ResumeStudio'))
