import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { supabase } from '../lib/supabase'
import { AuthCard, Divider, GoogleButton, inputClass, primaryButtonClass } from '../components/AuthCard'
import { usePageTitle } from '../lib/pageTitle'

export default function Signup() {
  usePageTitle('Create your free account')
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault() // stop the browser from reloading the page
    setError(null)
    if (password.length < 8) return setError('Use at least 8 characters for your password.')
    setBusy(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }, // our database trigger copies this into profiles
        emailRedirectTo: `${window.location.origin}/home`,
      },
    })

    setBusy(false)
    if (error) return setError(error.message)

    // If email confirmation is on, there is no session yet: the student must click the email link first.
    if (data.session) navigate('/home')
    else setCheckEmail(true)
  }

  if (checkEmail) {
    return (
      <AuthCard title="Check your email">
        <p className="text-soft">
          We sent a confirmation link to <b>{email}</b>. Click it to activate your account.
        </p>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Create your account">
      <GoogleButton />
      <Divider />
      <form onSubmit={handleSubmit} className="space-y-3">
        <input className={inputClass} placeholder="Full name" aria-label="Full name" autoComplete="name" maxLength={80} value={fullName}
          onChange={(e) => setFullName(e.target.value)} required />
        <input className={inputClass} type="email" placeholder="Email" aria-label="Email" autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)} required />
        <input className={inputClass} type="password" placeholder="Password" aria-label="Password" autoComplete="new-password" value={password}
          onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-bad" role="alert">{error}</p>}
        <button className={primaryButtonClass} disabled={busy}>
          {busy ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
      <p className="text-sm text-muted mt-4 text-center">
        Already have an account? <Link to="/login" className="text-accent-deep font-medium">Log in</Link>
      </p>
      <p className="text-xs text-subtle mt-4 text-center">
        By signing up you agree to our <Link to="/terms" className="underline hover:text-ink">Terms</Link> and <Link to="/privacy" className="underline hover:text-ink">Privacy policy</Link>.
      </p>
    </AuthCard>
  )
}
