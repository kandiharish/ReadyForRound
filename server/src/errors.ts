import { supabase } from './db/supabase.js'

const cut = (s: unknown, n: number) => (typeof s === 'string' ? s.slice(0, n) : null)

// Save an error to the app_errors table (and the server console). Never throws: logging must not cause new errors.
export function logError(source: 'server' | 'client', err: { message?: unknown; stack?: unknown }, extra: { path?: string; userId?: string; userAgent?: string } = {}) {
  const message = cut(err.message, 1000) || 'Unknown error'
  if (source === 'server') console.error(`[error] ${extra.path ?? ''} ${message}`)
  if (!supabase) return
  supabase.from('app_errors').insert({
    source,
    message,
    stack: cut(err.stack, 4000),
    path: cut(extra.path, 300),
    user_id: extra.userId ?? null,
    user_agent: cut(extra.userAgent, 300),
  }).then(({ error }) => { if (error) console.error('Could not save error log:', error.message) })
}
