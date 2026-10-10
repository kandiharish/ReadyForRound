import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { supabase } from '../lib/supabase'
import { AuthCard, inputClass, primaryButtonClass } from '../components/AuthCard'
import { usePageTitle } from '../lib/pageTitle'

// Step 1 of a password reset: we email a one-time link that opens /reset-password.
export default function ForgotPassword() {
  usePageTitle('Reset your password')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` })
    setBusy(false)
    // Only a rate limit is worth showing. "No such account" is never revealed, so nobody can test which emails are registered.
    if (error && error.status === 429) return setError('Too many reset emails. Please wait a minute and try again.')
    setSent(true)
  }

  if (sent) {
    return (
      <AuthCard title="Check your email">
        <p className="text-soft">
          If an account exists for <b>{email.trim()}</b>, we've sent a link to set a new password. It works once and expires in an hour.
        </p>
        <p className="text-sm text-muted mt-4">
          Nothing after a few minutes? Check your spam folder, or{' '}
          <button type="button" onClick={() => setSent(false)} className="text-accent-deep font-medium">try again</button>.
        </p>
        <p className="text-sm text-muted mt-6 text-center"><Link to="/login" className="text-accent-deep font-medium">Back to log in</Link></p>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Reset your password">
      <p className="text-sm text-soft -mt-2 mb-5">Enter the email you signed up with and we'll send you a link to set a new password.</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input className={inputClass} type="email" placeholder="Email" aria-label="Email" autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)} required />
        {error && <p className="text-sm text-bad" role="alert">{error}</p>}
        <button className={primaryButtonClass} disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
      </form>
      <p className="text-sm text-muted mt-4 text-center"><Link to="/login" className="text-accent-deep font-medium">Back to log in</Link></p>
    </AuthCard>
  )
}
