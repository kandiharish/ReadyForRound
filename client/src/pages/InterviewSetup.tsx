import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { apiFetch } from '../lib/api'
import type { Catalog, Interview, Profile, RoundId } from '../types'

type Choice = { mode: 'complete' } | { mode: 'single'; round: RoundId }

export default function InterviewSetup() {
  const navigate = useNavigate()
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [choice, setChoice] = useState<Choice>({ mode: 'complete' })
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([apiFetch<Catalog>('/catalog'), apiFetch<Profile>('/me')])
      .then(([c, p]) => { setCatalog(c); setProfile(p) })
      .catch((err) => setError(err.message))
  }, [])

  async function start() {
    setStarting(true)
    setError(null)
    try {
      const interview = await apiFetch<Interview>('/interviews', { method: 'POST', body: JSON.stringify(choice) })
      navigate(`/interview/${interview.id}`)
    } catch (err) {
      setError((err as Error).message)
      setStarting(false)
    }
  }

  if (!catalog || !profile) {
    return <Page>{error ? <p className="text-red-600">{error}</p> : <p className="text-slate-500">Loading…</p>}</Page>
  }

  const roundLabel = (id: RoundId) => catalog.rounds.find((r) => r.id === id)?.label ?? id
  const sequence = catalog.completeSequences[profile.target_company_type ?? 'any']
  const companyLabel = catalog.companyTypes.find((c) => c.id === profile.target_company_type)?.label ?? 'company'
  const selected = (c: Choice) =>
    c.mode === choice.mode && (c.mode === 'complete' || (choice.mode === 'single' && c.round === choice.round))
  const cardClass = (c: Choice) =>
    `w-full text-left border rounded-xl p-4 ${selected(c) ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-300 hover:border-indigo-400'}`

  return (
    <Page>
      <h1 className="text-2xl font-bold text-slate-900">Start a mock interview</h1>
      <p className="text-slate-500 mt-1">Questions are shaped by your role, experience, company type and skills.</p>

      <button onClick={() => setChoice({ mode: 'complete' })} className={`${cardClass({ mode: 'complete' })} mt-6`}>
        <p className="font-semibold text-slate-900">Complete interview</p>
        <p className="text-sm text-slate-500 mt-1">All rounds, like a real {companyLabel.toLowerCase()} drive:</p>
        <div className="flex flex-wrap items-center gap-1 mt-2 text-sm">
          {sequence.map((id, i) => (
            <span key={id} className="flex items-center gap-1">
              {i > 0 && <span className="text-slate-400">→</span>}
              <span className="bg-white border border-slate-200 rounded-full px-2 py-0.5">{roundLabel(id)}</span>
            </span>
          ))}
        </div>
      </button>

      <p className="text-sm font-medium text-slate-700 mt-6 mb-2">Or practise one round</p>
      <div className="grid sm:grid-cols-2 gap-2">
        {catalog.rounds.map((r) => (
          <button key={r.id} onClick={() => setChoice({ mode: 'single', round: r.id })}
            className={cardClass({ mode: 'single', round: r.id })}>
            <p className="font-semibold text-slate-900">{r.label}</p>
            <p className="text-sm text-slate-500 mt-1">{r.description}</p>
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

      <div className="flex items-center justify-between mt-8">
        <Link to="/dashboard" className="text-slate-600">← Back</Link>
        <button onClick={start} disabled={starting}
          className="bg-indigo-600 text-white rounded-lg px-5 py-2 font-medium disabled:opacity-50">
          {starting ? 'Preparing your interviewer…' : 'Start interview'}
        </button>
      </div>
    </Page>
  )
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6 sm:p-8 mt-4">{children}</div>
    </main>
  )
}
