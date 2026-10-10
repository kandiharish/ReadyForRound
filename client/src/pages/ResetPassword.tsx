import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { AuthCard, inputClass, primaryButtonClass } from '../components/AuthCard'
import { usePageTitle } from '../lib/pageTitle'

// Step 2 of a password reset: the emailed link signs the student in for this one purpose, then they choose a new password.
export default function ResetPassword() {
  usePageTitle('Choose a new password')
  const navigate = useNavigate()
  const { session, loading } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // The link's sign-in can arrive a moment after the page loads, so wait briefly before calling the link expired
  const [waited, setWaited] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 2500)
    return () => clearTimeout(t)
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) return setError('Use at least 8 characters.')
    if (password !== confirm) return setError("The two passwords don't match.")
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) return setError(error.message)
    navigate('/home', { replace: true })
  }

  if (!session) {
    if (loading || !waited) {
      return <AuthCard title="Choose a new password"><p className="text-soft">Checking your link…</p></AuthCard>
    }
    return (
      <AuthCard title="This link has expired">
        <p className="text-soft">Reset links work once and expire after an hour. Request a new one and use the latest email.</p>
        <Link to="/forgot-password" className={`${primaryButtonClass} inline-flex items-center justify-center mt-6`}>Send a new link</Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Choose a new password">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input className={inputClass} type="password" placeholder="New password (min 8 characters)" aria-label="New password" autoComplete="new-password"
          value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
        <input className={inputClass} type="password" placeholder="Type it again" aria-label="Confirm new password" autoComplete="new-password"
          value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} required />
        {error && <p className="text-sm text-bad" role="alert">{error}</p>}
        <button className={primaryButtonClass} disabled={busy}>{busy ? 'Saving…' : 'Save and continue'}</button>
      </form>
    </AuthCard>
  )
}
