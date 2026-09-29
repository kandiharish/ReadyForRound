import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { apiFetch } from '../lib/api'
import type { Catalog, Interview, RoundId } from '../types'

export default function InterviewRoom() {
  const { id } = useParams()
  const [interview, setInterview] = useState<Interview | null>(null)
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [answer, setAnswer] = useState('')
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([apiFetch<Interview>(`/interviews/${id}`), apiFetch<Catalog>('/catalog')])
      .then(([i, c]) => { setInterview(i); setCatalog(c) })
      .catch((err) => setError(err.message))
  }, [id])

  // Keep the newest question in view.
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), [interview?.turns.length])

  async function send(body: { answer: string } | { skip: true }) {
    setThinking(true)
    setError(null)
    try {
      const next = await apiFetch<Interview>(`/interviews/${id}/answer`, { method: 'POST', body: JSON.stringify(body) })
      setInterview(next)
      setAnswer('')
    } catch (err) {
      setError((err as Error).message) // the answer stays in the box so the student can retry
    } finally {
      setThinking(false)
    }
  }

  async function endEarly() {
    if (!confirm('End this interview now? Your answers so far are saved.')) return
    try {
      setInterview(await apiFetch<Interview>(`/interviews/${id}/end`, { method: 'POST' }))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  if (!interview || !catalog) {
    return (
      <main className="min-h-screen bg-slate-50 p-4">
        <p className="max-w-2xl mx-auto mt-8 text-slate-500">{error ?? 'Loading interview…'}</p>
      </main>
    )
  }

  const roundLabel = (r: RoundId) => catalog.rounds.find((x) => x.id === r)?.label ?? r
  const inProgress = interview.status === 'in_progress'
  const current = interview.turns[interview.turns.length - 1]
  const currentRound = interview.rounds[interview.current_round_index]
  const mainInRound = interview.turns.filter((t) => t.round === currentRound && !t.is_follow_up).length

  return (
    <main className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Round progress */}
        <header className="py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="font-bold text-indigo-600">ReadyForRound</Link>
            {inProgress && <button onClick={endEarly} className="text-sm text-slate-500 hover:text-red-600">End interview</button>}
          </div>
          <div className="flex gap-2 mt-4">
            {interview.rounds.map((r, i) => {
              const state = !inProgress || i < interview.current_round_index ? 'done' : i === interview.current_round_index ? 'now' : 'later'
              return (
                <div key={r} className="flex-1">
                  <div className={`h-1.5 rounded-full ${state === 'done' ? 'bg-green-500' : state === 'now' ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                  <p className={`text-xs mt-1 ${state === 'now' ? 'text-indigo-700 font-semibold' : 'text-slate-500'}`}>{roundLabel(r)}</p>
                </div>
              )
            })}
          </div>
          {inProgress && (
            <p className="text-xs text-slate-500 mt-2">
              {roundLabel(currentRound)} round · question {mainInRound} of {interview.questionsPerRound}
            </p>
          )}
        </header>

        {/* Conversation so far */}
        <div className="space-y-4">
          {interview.turns.map((t, i) => {
            const newRound = i === 0 || interview.turns[i - 1].round !== t.round
            return (
              <div key={t.seq}>
                {newRound && <p className="text-xs uppercase tracking-wide text-slate-400 text-center my-4">{roundLabel(t.round)} round</p>}
                <div className="bg-white rounded-xl shadow-sm p-4">
                  <p className="text-xs text-indigo-600 font-medium">Interviewer{t.is_follow_up ? ' · follow-up' : ''}</p>
                  <p className="text-slate-900 mt-1 whitespace-pre-line">{t.question}</p>
                </div>
                {t.answer !== null && (
                  <div className="bg-indigo-600 text-white rounded-xl p-4 mt-2 ml-8">
                    <p className="text-xs text-indigo-200 font-medium">You</p>
                    <p className="mt-1 whitespace-pre-line">{t.skipped ? <i className="text-indigo-200">Skipped</i> : t.answer}</p>
                  </div>
                )}
              </div>
            )
          })}
          {thinking && <p className="text-sm text-slate-500 animate-pulse">Interviewer is thinking…</p>}
          <div ref={bottomRef} />
        </div>

        {/* Answer box, or the finished message */}
        {inProgress ? (
          <div className="bg-white rounded-xl shadow p-4 mt-6 sticky bottom-4">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer… (voice answers are coming soon)"
              rows={4}
              maxLength={3000}
              disabled={thinking || current.answer !== null}
              className="w-full border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            <div className="flex justify-between items-center mt-2">
              <button onClick={() => send({ skip: true })} disabled={thinking} className="text-sm text-slate-500 hover:text-slate-800">
                Skip question
              </button>
              <button onClick={() => send({ answer })} disabled={thinking || !answer.trim()}
                className="bg-indigo-600 text-white rounded-lg px-5 py-2 font-medium disabled:opacity-40">
                {thinking ? 'Sending…' : 'Submit answer'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mt-6 text-center">
            <p className="text-lg font-bold text-green-800">
              {interview.status === 'completed' ? 'Interview complete 🎉' : 'Interview ended'}
            </p>
            <p className="text-green-700 text-sm mt-1">Your detailed feedback report is the next feature we're building.</p>
            <div className="flex justify-center gap-3 mt-4">
              <Link to="/interview/new" className="bg-indigo-600 text-white rounded-lg px-4 py-2 font-medium">New interview</Link>
              <Link to="/dashboard" className="border border-slate-300 rounded-lg px-4 py-2">Dashboard</Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
