import { supabase } from './supabase'

// An error from our backend, with its HTTP status (e.g. 503 = service unavailable).
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// Calls our backend and attaches the logged-in user's token,
// so the backend knows who is asking.
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      // Audio uploads set their own type; everything else is JSON.
      ...(options.body instanceof Blob ? { 'Content-Type': options.body.type || 'audio/webm' } : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, body.error ?? `Request failed (${res.status})`)
  return body as T
}
