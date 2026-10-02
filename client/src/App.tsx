import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router'
import { ThemeToggle } from './components/ThemeToggle'
import { AuthProvider } from './auth/AuthProvider'
import { ProtectedRoute } from './auth/ProtectedRoute'
import AppLayout from './layout/AppLayout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Status from './pages/Status'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Practice from './pages/Practice'
import Reports from './pages/Reports'
import ReportPage from './pages/ReportPage'
import Goals from './pages/Goals'
import Roadmap from './pages/Roadmap'
import ProfilePage from './pages/ProfilePage'
import Settings from './pages/Settings'
import InterviewRoom from './pages/InterviewRoom'
import { PrivacyPage, TermsPage } from './pages/Legal'

// The app's "map": which page to show for each web address.
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <CornerThemeToggle />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
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
            <Route path="/reports" element={<Reports />} />
            <Route path="/interview/:id/report" element={<ReportPage />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Old addresses still work */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/dashboard" element={<Navigate to="/home" replace />} />
          <Route path="/interview/new" element={<Navigate to="/practice" replace />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
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
