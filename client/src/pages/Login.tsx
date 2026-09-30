import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { AuthCard, Divider, GoogleButton, inputClass, primaryButtonClass } from '../components/AuthCard'

export default function Login() {
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
        <input className={inputClass} type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} required />
        <input className={inputClass} type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-bad">{error}</p>}
        <button className={primaryButtonClass} disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="text-sm text-muted mt-4 text-center">
        New here? <Link to="/signup" className="text-gold-deep font-medium">Create an account</Link>
      </p>
    </AuthCard>
  )
}
