import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useMe } from '../auth/MeProvider'
import { Button, ButtonLink, Card, PageHeader } from '../components/ui'
import { apiFetch } from '../lib/api'
import { sessionTitle } from '../lib/sessions'
import type { Interview, QuestionFeedback, Report, ReportResponse, RoundId } from '../types'

// The feedback report for one interview. Shows feedback and scores only, never the student's answer text.
export default function ReportPage() {
  const { id } = useParams()
  const { me, catalog } = useMe()
  const [res, setRes] = useState<ReportResponse | null>(null)
  const [interview, setInterview] = useState<Interview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const hideScores = me?.practice_without_score ?? false

  const load = useCallback(() => apiFetch<ReportResponse>(`/interviews/${id}/report`).then(setRes).catch((e) => setError(e.message)), [id])

  useEffect(() => {
    apiFetch<Interview>(`/interviews/${id}`).then(setInterview).catch((e) => setError(e.message))
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
  const title = !interview ? 'Interview' : sessionTitle(interview, roundLabel)
  const when = interview
    ? `${new Date(interview.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}${interview.status === 'ended_early' ? ' · ended early' : ''}`
    : ''

  return (
    <div className="space-y-6">
        <PageHeader eyebrow={`Reports / ${title}${when ? ` · ${when}` : ''}`} title="Your feedback"
          actions={<>
            <ButtonLink to="/reports" variant="secondary">All reports</ButtonLink>
            <ButtonLink to="/practice">Practise again</ButtonLink>
          </>} />

        {error && <p className="text-rose">{error}</p>}

        {(!res || res.status === 'generating') && !error && (
          <Card className="text-center py-10">
            <div className="w-10 h-10 mx-auto rounded-full border-4 border-lime/30 border-t-lime animate-spin" />
            <p className="font-semibold mt-4">Preparing your report…</p>
            <p className="text-sm text-muted mt-1">Our AI coach is reviewing each of your answers. This usually takes under a minute.</p>
          </Card>
        )}

        {res?.status === 'failed' && (
          <Card className="text-center py-10">
            <p className="font-semibold">We couldn't prepare your report this time.</p>
            <p className="text-sm text-muted mt-1">This is usually because the AI service was busy. Your answers are saved.</p>
            <Button onClick={retry} className="mt-4">Try again</Button>
          </Card>
        )}

        {res?.status === 'empty' && (
          <Card className="text-center py-10">
            <p className="font-semibold">No answers to review</p>
            <p className="text-sm text-muted mt-1">This interview ended before any question was answered.</p>
          </Card>
        )}

        {res?.status === 'ready' && <ReportView report={res.report} hideScores={hideScores} roundLabel={roundLabel} />}
    </div>
  )
}

function ReportView({ report, hideScores, roundLabel }: { report: Report; hideScores: boolean; roundLabel: (r: RoundId) => string }) {
  return (
    <div className="space-y-4 mt-6 pb-10">
      {/* Overall */}
      <section className="bg-ink-800 border border-line rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-center">
        {!hideScores && report.overallScore !== null && <ScoreRing value={report.overallScore} />}
        <div className="flex-1">
          <p className="text-fg leading-relaxed">{report.summary}</p>
          <p className="text-xs text-muted mt-3">
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
        <section className="bg-ink-800 border border-line rounded-2xl p-6">
          <h2 className="font-bold text-fg">📚 Study next</h2>
          <ol className="mt-3 space-y-3">
            {report.studyNext.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-6 h-6 shrink-0 rounded-full bg-lime-deep text-lime text-sm font-semibold flex items-center justify-center">{i + 1}</span>
                <span><b className="text-fg">{s.topic}</b>{s.why && <span className="text-soft">: {s.why}</span>}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Question by question */}
      <h2 className="font-bold text-fg pt-2">Question by question</h2>
      {report.questions.map((q) => <QuestionCard key={q.seq} q={q} hideScores={hideScores} roundLabel={roundLabel} />)}

      <p className="text-xs text-muted leading-relaxed">
        This feedback was written by AI against a fixed scoring guide. Scores are estimates to help you practise.
        They are not an employer's decision and don't predict whether you will be hired.
      </p>
    </div>
  )
}

function QuestionCard({ q, hideScores, roundLabel }: { q: QuestionFeedback; hideScores: boolean; roundLabel: (r: RoundId) => string }) {
  const [showAnswer, setShowAnswer] = useState(false)
  return (
    <section className="bg-ink-800 border border-line rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-lime font-medium uppercase tracking-wide">
            {roundLabel(q.round)}{q.skill ? ` · ${q.skill}` : ''}
          </p>
          <p className="font-semibold text-fg mt-1">{q.question}</p>
        </div>
        {q.skipped
          ? <span className="shrink-0 text-xs bg-ink-750 text-soft rounded-full px-2 py-1">Skipped</span>
          : !hideScores && q.score !== null && <ScoreChip score={q.score} />}
      </div>

      {!q.skipped && (
        <div className="mt-4 space-y-3 text-sm">
          <div>
            <p className="font-medium text-lime">What went well</p>
            <p className="text-soft mt-0.5">{q.wentWell}</p>
          </div>
          {q.missing.length > 0 && (
            <div>
              <p className="font-medium text-amber">What was missing</p>
              <ul className="list-disc pl-5 text-soft mt-0.5 space-y-0.5">
                {q.missing.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {q.betterAnswer && (
        <div className="mt-4">
          <button onClick={() => setShowAnswer(!showAnswer)} className="text-sm text-lime font-medium">
            {showAnswer ? '▾ Hide' : '▸ Show'} one strong way to answer
          </button>
          {showAnswer && <p className="text-sm text-soft bg-lime-deep rounded-lg p-3 mt-2 leading-relaxed">{q.betterAnswer}</p>}
        </div>
      )}

      {q.confidence === 'low' && !q.skipped && (
        <p className="text-xs text-muted mt-3">ℹ️ Our AI coach was less sure about this grade.</p>
      )}
    </section>
  )
}

function ScoreChip({ score }: { score: number }) {
  const tone = score >= 7 ? 'bg-lime-deep text-lime' : score >= 4 ? 'bg-amber-deep text-amber' : 'bg-rose-deep text-rose'
  return <span className={`shrink-0 text-sm font-semibold rounded-full px-3 py-1 ${tone}`}>{score}/10</span>
}

function ScoreRing({ value }: { value: number }) {
  const r = 42
  const circumference = 2 * Math.PI * r
  const color = value >= 70 ? '#c6f36b' : value >= 40 ? '#f5b85a' : '#ff8a95'
  return (
    <div className="relative w-28 h-28 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#232838" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={circumference * (1 - value / 100)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-mono font-semibold text-fg">{value}</span>
        <span className="text-xs text-muted">out of 100</span>
      </div>
    </div>
  )
}

function ListCard({ title, icon, items, tone }: { title: string; icon: string; items: string[]; tone: 'green' | 'amber' }) {
  return (
    <section className={`bg-ink-800 border border-line rounded-2xl p-6 border-t-4 ${tone === 'green' ? 'border-lime' : 'border-amber'}`}>
      <h2 className="font-bold text-fg">{icon} {title}</h2>
      <ul className="mt-3 space-y-2 text-sm text-soft">
        {items.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
    </section>
  )
}
