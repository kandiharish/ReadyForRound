import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'

// Shared layout for the login and signup pages.
export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-card border border-line rounded-3xl p-8 max-w-sm w-full">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span className="w-7 h-7 rounded-lg bg-accent text-on-accent flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 17l5-5 4 4 7-8M15 8h5v5" /></svg>
          </span>
          ReadyForRound
        </p>
        <h1 className="font-display font-semibold text-4xl text-ink mt-5">{title}</h1>
        <div className="mt-6">{children}</div>
      </div>
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
