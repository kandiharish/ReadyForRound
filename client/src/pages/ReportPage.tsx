import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { apiFetch } from '../lib/api'
import type { Catalog, Interview, Profile, QuestionFeedback, Report, ReportResponse, RoundId } from '../types'

// The feedback report for one interview. Shows feedback and scores only, never the student's answer text.
export default function ReportPage() {
  const { id } = useParams()
  const [res, setRes] = useState<ReportResponse | null>(null)
  const [interview, setInterview] = useState<Interview | null>(null)
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [hideScores, setHideScores] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => apiFetch<ReportResponse>(`/interviews/${id}/report`).then(setRes).catch((e) => setError(e.message)), [id])

  useEffect(() => {
    Promise.all([apiFetch<Interview>(`/interviews/${id}`), apiFetch<Catalog>('/catalog'), apiFetch<Profile>('/me')])
      .then(([i, c, me]) => { setInterview(i); setCatalog(c); setHideScores(me.practice_without_score) })
      .catch((e) => setError(e.message))
    load()
  }, [id, load])

  // While the report is being made, check again every 3 seconds.
  useEffect(() => {
    if (res?.status !== 'generating') return
    const t = setTimeout(load, 3000)
    return () => clearTimeout(t)
  }, [res, load])

  async function retry() {
    setRes({ status: 'generating' })
    await apiFetch(`/interviews/${id}/report/retry`, { method: 'POST' }).catch((e) => setError(e.message))
  }

  const roundLabel = (r: RoundId) => catalog?.rounds.find((x) => x.id === r)?.label ?? r
  const title = !interview ? 'Interview' : interview.mode === 'complete' ? 'Complete interview' : `${roundLabel(interview.rounds[0])} round`

  return (
    <main className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between py-4">
          <Link to="/dashboard" className="font-bold text-indigo-600">ReadyForRound</Link>
          <Link to="/interview/new" className="text-sm bg-indigo-600 text-white rounded-lg px-4 py-2 font-medium">New interview</Link>
        </header>

        <h1 className="text-2xl font-bold text-slate-900">Your feedback: {title}</h1>
        {interview && (
          <p className="text-slate-500 mt-1 text-sm">
            {new Date(interview.created_at).toLocaleString()}
            {interview.status === 'ended_early' && ' · ended early'}
          </p>
        )}

        {error && <p className="text-red-600 mt-6">{error}</p>}

        {(!res || res.status === 'generating') && !error && (
          <div className="bg-white rounded-xl shadow p-8 mt-6 text-center">
            <div className="w-10 h-10 mx-auto rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
            <p className="font-semibold text-slate-900 mt-4">Preparing your report…</p>
            <p className="text-sm text-slate-500 mt-1">Our AI coach is reviewing each of your answers. This usually takes under a minute.</p>
          </div>
        )}

        {res?.status === 'failed' && (
          <div className="bg-white rounded-xl shadow p-8 mt-6 text-center">
            <p className="font-semibold text-slate-900">We couldn't prepare your report this time.</p>
            <p className="text-sm text-slate-500 mt-1">This is usually because the AI service was busy. Your answers are saved.</p>
            <button onClick={retry} className="mt-4 bg-indigo-600 text-white rounded-lg px-4 py-2 font-medium">Try again</button>
          </div>
        )}

        {res?.status === 'empty' && (
          <div className="bg-white rounded-xl shadow p-8 mt-6 text-center">
            <p className="font-semibold text-slate-900">No answers to review</p>
            <p className="text-sm text-slate-500 mt-1">This interview ended before any question was answered.</p>
          </div>
        )}

        {res?.status === 'ready' && <ReportView report={res.report} hideScores={hideScores} roundLabel={roundLabel} />}
      </div>
    </main>
  )
}

function ReportView({ report, hideScores, roundLabel }: { report: Report; hideScores: boolean; roundLabel: (r: RoundId) => string }) {
  return (
    <div className="space-y-4 mt-6 pb-10">
      {/* Overall */}
      <section className="bg-white rounded-xl shadow p-6 flex flex-col sm:flex-row gap-6 items-center">
        {!hideScores && report.overallScore !== null && <ScoreRing value={report.overallScore} />}
        <div className="flex-1">
          <p className="text-slate-800 leading-relaxed">{report.summary}</p>
          <p className="text-xs text-slate-500 mt-3">
            {report.answeredCount} answered · {report.skippedCount} skipped
          </p>
        </div>
      </section>

      {/* Strengths and improvements */}
      <div className="grid sm:grid-cols-2 gap-4">
        <ListCard title="What went well" icon="✅" items={report.strengths} tone="green" />
        <ListCard title="What to work on" icon="🎯" items={report.improvements} tone="amber" />
      </div>

      {/* Study next */}
      {report.studyNext.length > 0 && (
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="font-bold text-slate-900">📚 Study next</h2>
          <ol className="mt-3 space-y-3">
            {report.studyNext.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-6 h-6 shrink-0 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold flex items-center justify-center">{i + 1}</span>
                <span><b className="text-slate-900">{s.topic}</b>{s.why && <span className="text-slate-600">: {s.why}</span>}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Question by question */}
      <h2 className="font-bold text-slate-900 pt-2">Question by question</h2>
      {report.questions.map((q) => <QuestionCard key={q.seq} q={q} hideScores={hideScores} roundLabel={roundLabel} />)}

      <p className="text-xs text-slate-500 leading-relaxed">
        This feedback was written by AI against a fixed scoring guide. Scores are estimates to help you practise.
        They are not an employer's decision and don't predict whether you will be hired.
      </p>
    </div>
  )
}

function QuestionCard({ q, hideScores, roundLabel }: { q: QuestionFeedback; hideScores: boolean; roundLabel: (r: RoundId) => string }) {
  const [showAnswer, setShowAnswer] = useState(false)
  return (
    <section className="bg-white rounded-xl shadow p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide">
            {roundLabel(q.round)}{q.skill ? ` · ${q.skill}` : ''}
          </p>
          <p className="font-semibold text-slate-900 mt-1">{q.question}</p>
        </div>
        {q.skipped
          ? <span className="shrink-0 text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-1">Skipped</span>
          : !hideScores && q.score !== null && <ScoreChip score={q.score} />}
      </div>

      {!q.skipped && (
        <div className="mt-4 space-y-3 text-sm">
          <div>
            <p className="font-medium text-green-700">What went well</p>
            <p className="text-slate-700 mt-0.5">{q.wentWell}</p>
          </div>
          {q.missing.length > 0 && (
            <div>
              <p className="font-medium text-amber-700">What was missing</p>
              <ul className="list-disc pl-5 text-slate-700 mt-0.5 space-y-0.5">
                {q.missing.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {q.betterAnswer && (
        <div className="mt-4">
          <button onClick={() => setShowAnswer(!showAnswer)} className="text-sm text-indigo-600 font-medium">
            {showAnswer ? '▾ Hide' : '▸ Show'} one strong way to answer
          </button>
          {showAnswer && <p className="text-sm text-slate-700 bg-indigo-50 rounded-lg p-3 mt-2 leading-relaxed">{q.betterAnswer}</p>}
        </div>
      )}

      {q.confidence === 'low' && !q.skipped && (
        <p className="text-xs text-slate-500 mt-3">ℹ️ Our AI coach was less sure about this grade.</p>
      )}
    </section>
  )
}

function ScoreChip({ score }: { score: number }) {
  const tone = score >= 7 ? 'bg-green-100 text-green-800' : score >= 4 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
  return <span className={`shrink-0 text-sm font-semibold rounded-full px-3 py-1 ${tone}`}>{score}/10</span>
}

function ScoreRing({ value }: { value: number }) {
  const r = 42
  const circumference = 2 * Math.PI * r
  const color = value >= 70 ? '#16a34a' : value >= 40 ? '#d97706' : '#dc2626'
  return (
    <div className="relative w-28 h-28 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={circumference * (1 - value / 100)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900">{value}</span>
        <span className="text-xs text-slate-500">out of 100</span>
      </div>
    </div>
  )
}

function ListCard({ title, icon, items, tone }: { title: string; icon: string; items: string[]; tone: 'green' | 'amber' }) {
  return (
    <section className={`bg-white rounded-xl shadow p-6 border-t-4 ${tone === 'green' ? 'border-green-500' : 'border-amber-500'}`}>
      <h2 className="font-bold text-slate-900">{icon} {title}</h2>
      <ul className="mt-3 space-y-2 text-sm text-slate-700">
        {items.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
    </section>
  )
}
