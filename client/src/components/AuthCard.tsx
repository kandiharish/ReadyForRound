import { useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router'
import { Brand } from './Brand'

// True while a CSS media query matches (updates live when the window is resized)
function useMedia(query: string) {
  const [match, setMatch] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const m = window.matchMedia(query)
    const on = () => setMatch(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [query])
  return match
}

const FEATURES = ['Voice mock interviews', 'Live Jobs Board', 'Resume Studio + ATS check', 'Group discussion practice', 'Career Compass']

// Shared layout for the login and signup pages.
// Wide screens: a dark intro panel on the left (a short, silent tour of the real app) and the form on the right.
// Phones: just the form.
export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  const wide = useMedia('(min-width: 1024px)')
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(420px,1fr)]">
      {wide && <IntroPanel />}
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-paper">
        <div className="bg-card border border-line rounded-2xl p-7 sm:p-8 max-w-sm w-full shadow-sm">
          <Link to="/" aria-label="ReadyForRound home"><Brand tagline /></Link>
          <h1 className="font-display font-bold text-[1.75rem] text-ink mt-5">{title}</h1>
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  )
}

function IntroPanel() {
  // People who ask for less motion get the still picture instead of the video
  const still = useMedia('(prefers-reduced-motion: reduce)')
  return (
    <aside className="relative hidden lg:flex flex-col justify-center gap-9 px-12 xl:px-16 py-12 bg-[#0b1220] text-white overflow-hidden">
      <div className="relative max-w-xl">
        <p className="text-sm font-semibold text-[#5fb8ff]">Free for every student</p>
        <h2 className="mt-3 text-[2.5rem] xl:text-[2.75rem] font-bold leading-[1.1] tracking-tight">
          Walk into your next round ready.
        </h2>
        <p className="mt-4 text-[1.05rem] leading-relaxed text-white/70">
          Practise interviews out loud, see which jobs are hiring right now, and fix your resume before a recruiter sees it.
        </p>
      </div>

      <figure className="relative max-w-2xl rounded-2xl overflow-hidden border border-white/10 shadow-xl shadow-black/40 bg-[#131a2a]">
        {still ? (
          <img src="/intro/intro-poster.jpg" alt="The ReadyForRound Jobs Board, showing which roles have the most openings" className="block w-full aspect-video object-cover" />
        ) : (
          <video src="/intro/intro.mp4" poster="/intro/intro-poster.jpg" autoPlay muted loop playsInline preload="auto"
            aria-label="A short silent tour of ReadyForRound: the Jobs Board, company practice, Resume Studio and Career Compass"
            className="block w-full aspect-video object-cover" />
        )}
      </figure>

      <ul className="relative flex flex-wrap gap-2 max-w-2xl" aria-label="What you get">
        {FEATURES.map((f) => (
          <li key={f} className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-sm text-white/80">{f}</li>
        ))}
      </ul>
    </aside>
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
