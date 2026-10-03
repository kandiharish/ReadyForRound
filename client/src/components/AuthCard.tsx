import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router'
import { Brand } from './Brand'
import { AuthBackground, QuestionRow } from './AuthBackground'

// Shared layout for the login and signup pages.
export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center gap-5 p-4 overflow-hidden">
      <AuthBackground />
      <QuestionRow />
      <div className="relative z-10 bg-card/85 backdrop-blur-xl border border-line rounded-3xl p-7 sm:p-8 max-w-sm w-full shadow-2xl shadow-accent/10 animate-[pop-in_0.5s_ease-out]">
        <Link to="/" aria-label="ReadyForRound home"><Brand tagline /></Link>
        <h1 className="font-display font-semibold text-4xl text-ink mt-5">{title}</h1>
        <div className="mt-6">{children}</div>
      </div>
      <QuestionRow reverse />
    </main>
  )
}

export function GoogleButton() {
  async function signInWithGoogle() {
    // Sends the student to Google; Google sends them back to /home when done.
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/home` },
    })
  }

  return (
    <button
      type="button"
      onClick={signInWithGoogle}
      className="w-full min-h-11 border border-line-strong rounded-xl font-medium text-ink bg-raised hover:bg-hover"
    >
      Continue with Google
    </button>
  )
}

export function Divider() {
  return (
    <div className="flex items-center gap-3 my-4 text-xs text-subtle">
      <span className="flex-1 border-t border-line" /> or <span className="flex-1 border-t border-line" />
    </div>
  )
}

export const inputClass =
  'w-full min-h-11 bg-raised border border-line-strong rounded-xl px-3 text-ink placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent'
export const primaryButtonClass =
  'w-full min-h-11 bg-accent text-on-accent rounded-xl font-semibold hover:bg-ink-hover disabled:opacity-50'
