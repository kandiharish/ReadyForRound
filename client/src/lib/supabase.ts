import { createClient } from '@supabase/supabase-js'

// The browser uses the PUBLISHABLE key. It is safe to be public because
// the database's security rules (Row Level Security) decide what each user may see.
const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !publishableKey) {
  console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY is missing in client/.env')
}

export const supabase = createClient(url ?? '', publishableKey ?? '')
