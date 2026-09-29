import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { apiFetch } from '../lib/api'

type Profile = {
  id: string
  full_name: string | null
  role: string
  target_role: string | null
  experience_level: string | null
}

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Ask OUR backend "who am I?" - this proves the token travels frontend -> backend -> Supabase.
  useEffect(() => {
    apiFetch<Profile>('/me').then(setProfile).catch((err) => setError(err.message))
  }, [])

  return (
    <main className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center justify-between py-4">
          <p className="font-bold text-indigo-600">ReadyForRound</p>
          <button onClick={() => supabase.auth.signOut()} className="text-sm text-slate-600 hover:text-slate-900">
            Log out
          </button>
        </header>

        <div className="bg-white rounded-xl shadow p-8 mt-4">
          {error && <p className="text-red-600">{error}</p>}
          {!profile && !error && <p className="text-slate-500">Loading your profile…</p>}
          {profile && (
            <>
              <h1 className="text-2xl font-bold text-slate-900">
                Hi {profile.full_name || 'there'} 👋
              </h1>
              <p className="text-slate-500 mt-1">You're logged in as a <b>{profile.role}</b>.</p>
              <p className="text-slate-500 mt-4 text-sm">Interview practice is coming next.</p>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
