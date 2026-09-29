import { useEffect, useState } from 'react'

type Health = {
  status: string
  llmProvider: string
  llmReachable: boolean
  dbConnected: boolean
}

// Developer page: shows whether the backend, AI and database are working.
export default function Status() {
  const [health, setHealth] = useState<Health | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => setError('Cannot reach the backend. Is the server running?'))
  }, [])

  const yesNo = (ok: boolean, yes: string, no: string) => (
    <b className={ok ? 'text-green-600' : 'text-red-600'}>{ok ? yes : no}</b>
  )

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-slate-900">System status</h1>
        <div className="mt-6 space-y-2 text-sm">
          {error && <p className="text-red-600">{error}</p>}
          {!health && !error && <p className="text-slate-500">Checking connection…</p>}
          {health && (
            <>
              <p>Backend: <b className="text-green-600">{health.status}</b></p>
              <p>AI provider: <b>{health.llmProvider}</b></p>
              <p>AI reachable: {yesNo(health.llmReachable, 'yes', 'no')}</p>
              <p>Database: {yesNo(health.dbConnected, 'connected', 'not connected')}</p>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
