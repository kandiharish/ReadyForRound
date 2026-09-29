import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'

// Shared layout for the login and signup pages.
export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow p-8 max-w-sm w-full">
        <p className="text-sm font-semibold text-indigo-600">ReadyForRound</p>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">{title}</h1>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  )
}

export function GoogleButton() {
  async function signInWithGoogle() {
    // Sends the student to Google; Google sends them back to /dashboard when done.
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  }

  return (
    <button
      type="button"
      onClick={signInWithGoogle}
      className="w-full border border-slate-300 rounded-lg py-2 font-medium text-slate-700 hover:bg-slate-50"
    >
      Continue with Google
    </button>
  )
}

export function Divider() {
  return (
    <div className="flex items-center gap-3 my-4 text-xs text-slate-400">
      <span className="flex-1 border-t" /> or <span className="flex-1 border-t" />
    </div>
  )
}

export const inputClass =
  'w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500'
export const primaryButtonClass =
  'w-full bg-indigo-600 text-white rounded-lg py-2 font-medium hover:bg-indigo-700 disabled:opacity-50'
