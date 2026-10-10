import { Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router'
import { ThemeToggle } from './components/ThemeToggle'
import { FeedbackProvider } from './components/Feedback'
import { FeedbackButton } from './components/FeedbackButton'
import { AuthProvider } from './auth/AuthProvider'
import { ProtectedRoute } from './auth/ProtectedRoute'
import AppLayout from './layout/AppLayout'
import {
  Companies, CompanyPage, Compass, ForgotPassword, ResetPassword, GdHome, GdRoom, Goals, Home, InterviewRoom, JobPage, Jobs, Landing, Login, Market, MarketRolePage,
  Onboarding, Practice, PrivacyPage, ProfilePage, ReportPage, Reports, ResumeStudio, Roadmap, Settings, Signup, Status, TermsPage,
} from './lib/pages'

// The app's "map": which page to show for each web address.
function App() {
  return (
    <AuthProvider>
      <FeedbackProvider>
      <BrowserRouter>
        <CornerThemeToggle />
        <FeedbackButton />
        {/* Pages load on demand; this plain background shows for the split second while one downloads */}
        <Suspense fallback={<div className="min-h-screen bg-paper" />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/status" element={<Status />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* Full-screen pages (no sidebar) */}
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/interview/:id" element={<ProtectedRoute><InterviewRoom /></ProtectedRoute>} />

          {/* Pages inside the app shell (sidebar + tab bar) */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/home" element={<Home />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/companies/:id" element={<CompanyPage />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/interview/:id/report" element={<ReportPage />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/compass" element={<Compass />} />
            <Route path="/market" element={<Market />} />
            <Route path="/market/:role" element={<MarketRolePage />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobPage />} />
            <Route path="/gd" element={<GdHome />} />
            <Route path="/gd/:id" element={<GdRoom />} />
            <Route path="/resume" element={<ResumeStudio />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Old addresses still work */}
          <Route path="/dashboard" element={<Navigate to="/home" replace />} />
          <Route path="/interview/new" element={<Navigate to="/practice" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
      </FeedbackProvider>
    </AuthProvider>
  )
}

// Pages outside the app shell (login, sign-up, onboarding) show the light/dark switch in the corner.
// Pages inside the shell place it themselves.
function CornerThemeToggle() {
  const { pathname } = useLocation()
  return ['/login', '/signup', '/onboarding', '/status', '/privacy', '/terms'].includes(pathname) ? <ThemeToggle floating /> : null
}

export default App
