import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { AuthCard, Divider, GoogleButton, inputClass, primaryButtonClass } from '../components/AuthCard'
import { usePageTitle } from '../lib/pageTitle'

export default function Login() {
  usePageTitle('Log in')
  const navigate = useNavigate()
  const { session } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Already logged in? Skip the login page.
  if (session) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) return setError(error.message)
    navigate('/home')
  }

  return (
    <AuthCard title="Welcome back">
      <GoogleButton />
      <Divider />
      <form onSubmit={handleSubmit} className="space-y-3">
        <input className={inputClass} type="email" placeholder="Email" aria-label="Email" autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)} required />
        <input className={inputClass} type="password" placeholder="Password" aria-label="Password" autoComplete="current-password" value={password}
          onChange={(e) => setPassword(e.target.value)} required />
        <div className="text-right -mt-1">
          <Link to="/forgot-password" className="text-sm text-accent-deep font-medium">Forgot password?</Link>
        </div>
        {error && <p className="text-sm text-bad" role="alert">{error}</p>}
        <button className={primaryButtonClass} disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="text-sm text-muted mt-4 text-center">
        New here? <Link to="/signup" className="text-accent-deep font-medium">Create an account</Link>
      </p>
      <p className="text-xs text-subtle mt-4 text-center">
        <Link to="/privacy" className="hover:text-ink">Privacy</Link> · <Link to="/terms" className="hover:text-ink">Terms</Link>
      </p>
    </AuthCard>
  )
}
