import { useEffect, useState } from 'react'

type Health = {
  status: string
  llmProvider: string
  llmReachable: boolean
  dbConnected: boolean
  voiceAnswersReady: boolean
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
    <b className={ok ? 'text-lime' : 'text-rose'}>{ok ? yes : no}</b>
  )

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-ink-800 border border-line rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-fg">System status</h1>
        <div className="mt-6 space-y-2 text-sm">
          {error && <p className="text-rose">{error}</p>}
          {!health && !error && <p className="text-muted">Checking connection…</p>}
          {health && (
            <>
              <p>Backend: <b className="text-lime">{health.status}</b></p>
              <p>AI provider: <b>{health.llmProvider}</b></p>
              <p>AI reachable: {yesNo(health.llmReachable, 'yes', 'no')}</p>
              <p>Database: {yesNo(health.dbConnected, 'connected', 'not connected')}</p>
              <p>Voice answers: {yesNo(health.voiceAnswersReady, 'ready', 'needs GROQ_API_KEY')}</p>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
