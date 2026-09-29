import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router'
import { supabase } from '../lib/supabase'
import { apiFetch } from '../lib/api'
import type { Catalog, Option, Profile } from '../types'

const labelOf = (list: Option[], id: string | null) => list.find((o) => o.id === id)?.label ?? '—'

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([apiFetch<Profile>('/me'), apiFetch<Catalog>('/catalog')])
      .then(([me, cat]) => { setProfile(me); setCatalog(cat) })
      .catch((err) => setError(err.message))
  }, [])

  // New students go through onboarding first.
  if (profile && !profile.onboarding_completed) return <Navigate to="/onboarding" replace />

  return (
    <main className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center justify-between py-4">
          <p className="font-bold text-indigo-600">ReadyForRound</p>
          <button onClick={() => supabase.auth.signOut()} className="text-sm text-slate-600 hover:text-slate-900">
            Log out
          </button>
        </header>

        {error && <p className="text-red-600">{error}</p>}
        {!profile && !error && <p className="text-slate-500">Loading your profile…</p>}

        {profile && catalog && (
          <>
            <div className="bg-white rounded-xl shadow p-6 sm:p-8">
              <h1 className="text-2xl font-bold text-slate-900">Hi {profile.full_name || 'there'} 👋</h1>
              <p className="text-slate-500 mt-1">
                Preparing for <b className="text-slate-800">{labelOf(catalog.roles, profile.target_role)}</b> ·{' '}
                {labelOf(catalog.companyTypes, profile.target_company_type)}
              </p>
              <dl className="grid grid-cols-2 gap-4 mt-6 text-sm">
                <div>
                  <dt className="text-slate-500">Stage</dt>
                  <dd className="font-medium">{labelOf(catalog.experienceLevels, profile.experience_level)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Placement</dt>
                  <dd className="font-medium">{labelOf(catalog.placementTimelines, profile.placement_timeline)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Interviewer speed</dt>
                  <dd className="font-medium">{profile.speaking_pace === 'slow' ? 'Slower' : 'Normal'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Scores</dt>
                  <dd className="font-medium">{profile.practice_without_score ? 'Hidden (practice mode)' : 'Shown'}</dd>
                </div>
              </dl>
              <Link to="/onboarding" className="inline-block mt-5 text-sm text-indigo-600 font-medium">Edit profile</Link>
            </div>

            <div className="bg-white rounded-xl shadow p-6 sm:p-8 mt-4">
              <h2 className="font-bold text-slate-900">Your skills: claimed vs proven</h2>
              <p className="text-sm text-slate-500 mt-1">Your interviews will fill in the "proven" column.</p>
              <table className="w-full mt-4 text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="font-normal pb-2">Skill</th>
                    <th className="font-normal pb-2">You said</th>
                    <th className="font-normal pb-2">Proven</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.user_skills.map((s) => (
                    <tr key={s.skill} className="border-t border-slate-100">
                      <td className="py-2 font-medium">{s.skill}</td>
                      <td className="py-2">{'●'.repeat(s.self_rating)}<span className="text-slate-300">{'●'.repeat(5 - s.self_rating)}</span></td>
                      <td className="py-2 text-slate-400">{s.proven_score ?? 'Not tested yet'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-indigo-600 text-white rounded-xl p-6 mt-4">
              <p className="font-bold">Mock interviews are coming next</p>
              <p className="text-indigo-100 text-sm mt-1">
                Technical, HR, Behavioural and Project rounds, shaped by your role, company type and skills.
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
