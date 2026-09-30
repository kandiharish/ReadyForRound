import { useSyncExternalStore } from 'react'
import { useLocation } from 'react-router'

type Theme = 'light' | 'dark'
const KEY = 'rfr-theme'
const EVENT = 'rfr-theme-change'

// The theme lives in ONE place: the data-theme attribute on <html> (set before the page draws, in index.html).
// Every switch reads it from there, so all switches always agree.
const read = (): Theme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange)
  return () => window.removeEventListener(EVENT, onChange)
}

function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#131316' : '#F7F3EA')
  try { localStorage.setItem(KEY, theme) } catch { /* private mode: the choice just isn't remembered */ }
  window.dispatchEvent(new Event(EVENT)) // tell every switch on the page
}

export function useTheme() {
  return useSyncExternalStore(subscribe, read)
}

// Small round button: moon = switch to dark (night), sun = switch to light (morning).
export function ThemeToggle({ floating = false, className = '' }: { floating?: boolean; className?: string }) {
  const theme = useTheme()
  const { pathname } = useLocation()

  // The interview room is always a dark stage, so the switch isn't shown there.
  if (/^\/interview\/[^/]+$/.test(pathname)) return null

  const next: Theme = theme === 'dark' ? 'light' : 'dark'
  return (
    <button type="button" onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} mode`} title={`Switch to ${next} mode`}
      className={`${floating ? 'fixed top-3 right-3 lg:top-5 lg:right-5 z-30' : ''} w-10 h-10 rounded-full bg-card border border-line-strong text-ink shadow-sm hover:border-gold flex items-center justify-center transition-colors ${className}`}>
      {theme === 'dark' ? (
        // Sun: back to light mode
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" className="text-gold">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
        </svg>
      ) : (
        // Moon: to dark mode
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
        </svg>
      )}
    </button>
  )
}
