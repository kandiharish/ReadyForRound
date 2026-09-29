import { createClient } from '@supabase/supabase-js'
import { config } from '../config.js'

// One Supabase connection for the whole server, using the SECRET key.
// The secret key skips the database's security rules, so it must only ever live on the server.
export const supabase =
  config.SUPABASE_URL && config.SUPABASE_SECRET_KEY
    ? createClient(config.SUPABASE_URL, config.SUPABASE_SECRET_KEY, {
        auth: { persistSession: false },
      })
    : null

if (!supabase) {
  console.warn('SUPABASE_URL or SUPABASE_SECRET_KEY is not set in .env - running without a database.')
}

// Quick check used by /api/health: can we read the profiles table?
export async function isDbConnected() {
  if (!supabase) return false
  // A normal (non-"head") query, so a missing table is reported as an error.
  const { error } = await supabase.from('profiles').select('id').limit(1)
  if (error) console.warn('Database check failed:', error.message)
  return !error
}
