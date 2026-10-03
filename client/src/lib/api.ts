import { supabase } from './supabase'

// An error from our backend, with its HTTP status (e.g. 503 = service unavailable).
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// Where the backend lives. Empty on your laptop (Vite forwards /api to it); the backend's web address when online.
export const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

// Calls our backend and attaches the logged-in user's token,
// so the backend knows who is asking.
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: {
      // Audio uploads set their own type; everything else is JSON.
      ...(options.body instanceof Blob ? { 'Content-Type': options.body.type || 'audio/webm' } : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  // If the backend can't be reached, the website host may answer with a web page instead of data.
  // Treat that as "server unavailable" rather than pretending it was an empty answer.
  if (!(res.headers.get('content-type') ?? '').includes('application/json')) {
    throw new ApiError(503, "Can't reach the ReadyForRound server right now. Please try again in a minute.")
  }
  const body = await res.json().catch(() => ({}))
  // The login is no longer valid (expired, or the account was removed): log out, which sends the student to /login.
  if (res.status === 401 && token) await supabase.auth.signOut({ scope: 'local' })
  if (!res.ok) throw new ApiError(res.status, body.error ?? `Request failed (${res.status})`)
  return body as T
}
