import { API_URL } from './api'
import { supabase } from './supabase'

let sent = 0 // at most a few reports per page load, so one broken loop can't flood the server

// Send a browser error to our server's error log. Never throws.
export async function reportError(err: unknown, where = window.location.pathname) {
  if (sent >= 5) return
  sent++
  const e = err instanceof Error ? err : new Error(typeof err === 'string' ? err : 'Unknown error')
  try {
    const { data } = await supabase.auth.getSession()
    await fetch(`${API_URL}/api/client-errors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}) },
      body: JSON.stringify({ message: e.message, stack: e.stack, path: where }),
      keepalive: true,
    })
  } catch {
    /* reporting is best-effort */
  }
}

// Catch errors that happen outside React too (scripts, failed promises).
export function installGlobalErrorReporting() {
  window.addEventListener('error', (event) => reportError(event.error ?? event.message))
  window.addEventListener('unhandledrejection', (event) => reportError(event.reason))
}
