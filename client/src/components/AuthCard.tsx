import { useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router'
import { Brand } from './Brand'
import { Icon, type IconName } from './ui'
import { WordReveal } from './LandingMotion'

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

const POINTS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'mic', title: 'Practise out loud', text: 'An AI interviewer asks about your role and your own projects.' },
  { icon: 'trend', title: 'See real demand', text: 'Openings, pay and skills from live job ads, every day.' },
  { icon: 'file', title: 'Fix your resume', text: 'An ATS check and project fit before you apply.' },
]

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
          <Link to="/" aria-label="ReadyForRound home"><Brand /></Link>
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
    <aside className="relative hidden lg:flex flex-col justify-between gap-8 px-12 xl:px-16 py-9 bg-[#0b1220] text-white overflow-hidden">
      {/* A faint dot grid that fades out towards the edges: texture without colour */}
      <div aria-hidden="true" className="absolute inset-0 opacity-[0.35] [background-image:radial-gradient(rgb(255_255_255/0.14)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_40%_45%,black_20%,transparent_75%)]" />

      <Link to="/" aria-label="ReadyForRound home" className="relative flex items-center gap-2.5 w-fit">
        <img src="/logo-mark.png" alt="" className="w-8 h-8" />
        <span className="font-semibold text-[1.05rem] tracking-tight">Ready<span className="text-[#5fb8ff]">For</span>Round</span>
      </Link>

      <div className="relative max-w-2xl">
        <h2 className="text-[2.6rem] xl:text-[3rem] font-semibold leading-[1.08] tracking-tight">
          <WordReveal delay={100} lines={[['Walk', 'into', 'your'], ['next', 'round', <span className="text-[#5fb8ff]">ready.</span>]]} />
        </h2>

        <figure className="mt-8 rounded-xl overflow-hidden border border-white/10 bg-[#131a2a] shadow-[0_30px_70px_-25px_rgba(0,0,0,0.7)] animate-[pop-in_0.7s_cubic-bezier(0.22,1,0.36,1)_0.35s_both] motion-reduce:animate-none">
          {still ? (
            <img src="/intro/intro-poster.jpg" alt="The ReadyForRound Jobs Board, showing which roles have the most openings" className="block w-full aspect-video object-cover" />
          ) : (
            <video src="/intro/intro.mp4" poster="/intro/intro-poster.jpg" autoPlay muted loop playsInline preload="auto"
              aria-label="A short silent tour of ReadyForRound: the Jobs Board, company practice, Resume Studio and Career Compass"
              className="block w-full aspect-video object-cover" />
          )}
        </figure>


        <ul className="mt-8 grid grid-cols-3 gap-5 [@media(max-height:860px)]:hidden" aria-label="What you get">
          {POINTS.map((p, i) => (
            <li key={p.title} className="animate-[toast-in_0.5s_ease-out_both] motion-reduce:animate-none" style={{ animationDelay: `${600 + i * 120}ms` }}>
              <span className="w-9 h-9 rounded-lg bg-white/[0.07] border border-white/10 grid place-items-center text-[#5fb8ff]"><Icon name={p.icon} size={17} /></span>
              <p className="mt-3 text-sm font-semibold">{p.title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-white/55">{p.text}</p>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-white/40">Free for every student · No credit card · Your video never leaves your device</p>
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
