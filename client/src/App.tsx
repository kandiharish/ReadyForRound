import { useEffect, useState } from 'react'

type Health = {
  status: string
  llmProvider: string
  llmReachable: boolean
}

function App() {
  const [health, setHealth] = useState<Health | null>(null)
  const [error, setError] = useState<string | null>(null)

  // When the page loads, ask the backend "are you alive?"
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => setError('Cannot reach the backend. Is the server running?'))
  }, [])

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-slate-900">ReadyForRound</h1>
        <p className="text-slate-500 mt-1">From classroom learning to career readiness</p>

        <div className="mt-6 space-y-2 text-sm">
          {error && <p className="text-red-600">{error}</p>}
          {!health && !error && <p className="text-slate-500">Checking connection…</p>}
          {health && (
            <>
              <p>Backend: <b className="text-green-600">{health.status}</b></p>
              <p>AI provider: <b>{health.llmProvider}</b></p>
              <p>
                AI reachable:{' '}
                <b className={health.llmReachable ? 'text-green-600' : 'text-red-600'}>
                  {health.llmReachable ? 'yes' : 'no'}
                </b>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

export default App
