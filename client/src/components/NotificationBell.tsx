import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { apiFetch } from '../lib/api'

type Notification = {
  id: string
  kind: 'report' | 'streak' | 'roadmap' | 'deadline' | 'limit' | 'welcome'
  title: string
  body: string
  link: string
  at: string
}

const SEEN_KEY = 'rfr-seen-notifications'

// Each kind gets its own soft colour and icon.
const KIND = {
  report: { tint: 'bg-sage text-sage-ink', d: 'M5 12l5 5L20 7' },
  streak: { tint: 'bg-peach text-peach-ink', d: 'M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.5 2 1.5 3 3 3-1-3 0-6 0-8.5z' },
  roadmap: { tint: 'bg-lavender text-lavender-ink', d: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14' },
  deadline: { tint: 'bg-blush text-blush-ink', d: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4' },
  limit: { tint: 'bg-sky text-sky-ink', d: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2' },
  welcome: { tint: 'bg-sky text-sky-ink', d: 'M8 5v14l11-7z' },
} as const

function loadSeen(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]')) } catch { return new Set() }
}

// In-app notifications (no browser pop-ups): a bell with a count of new items and a small panel.
export function NotificationBell({ className = '' }: { className?: string }) {
  const [items, setItems] = useState<Notification[]>([])
  const [seen, setSeen] = useState<Set<string>>(loadSeen)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()

  // Refresh when the student moves between pages, and every 2 minutes.
  useEffect(() => {
    const load = () => apiFetch<Notification[]>('/notifications').then(setItems).catch(() => {})
    load()
    const t = setInterval(load, 120_000)
    return () => clearInterval(t)
  }, [pathname])

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  const unread = items.filter((n) => !seen.has(n.id)).length

  function toggle() {
    if (!open && unread) {
      // Opening the panel marks everything as seen (kept small: only ids still shown).
      const next = new Set(items.map((n) => n.id))
      setSeen(next)
      try { localStorage.setItem(SEEN_KEY, JSON.stringify([...next])) } catch { /* fine */ }
    }
    setOpen(!open)
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button type="button" onClick={toggle} aria-label={unread ? `Notifications, ${unread} new` : 'Notifications'} aria-expanded={open}
        className="relative w-10 h-10 rounded-full bg-card border border-line-strong text-ink shadow-sm hover:border-accent flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-blush-ink text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-paper">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div role="dialog" aria-label="Notifications"
          className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl bg-card border border-line shadow-2xl z-40 overflow-hidden animate-[toast-in_0.15s_ease-out]">
          <p className="px-4 py-3 border-b border-line font-display font-semibold text-xl">Notifications</p>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-sm text-muted text-center">You're all caught up.</p>
          ) : (
            <ul className="max-h-96 overflow-auto">
              {items.map((n) => (
                <li key={n.id} className="border-t border-line first:border-t-0">
                  <Link to={n.link} className="flex gap-3 px-4 py-3 hover:bg-raised">
                    <span className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${KIND[n.kind].tint}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={KIND[n.kind].d} /></svg>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink">{n.title}</span>
                      <span className="block text-xs text-muted mt-0.5">{n.body}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
