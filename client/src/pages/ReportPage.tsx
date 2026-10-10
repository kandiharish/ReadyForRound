import { useCallback, useEffect, useState } from 'react'
import { thoughtOfTheDay } from '../lib/inspiration'
import { useParams } from 'react-router'
import { useMe } from '../auth/MeProvider'
import { Button, ButtonLink, Card, Icon, PageHeader, type IconName } from '../components/ui'
import { apiFetch } from '../lib/api'
import { sessionTitle } from '../lib/sessions'
import type { Interview, InterviewTurn, QuestionFeedback, Report, ReportResponse, RoundId, SpeechStats } from '../types'
import { ReportSkeleton } from '../components/Skeleton'
import { SpeakingCoach, SpeechLine } from '../components/SpeakingCoach'
import { ShareButton, type ShareData } from '../components/ShareCard'
import { ResourceLinks } from '../components/ResourceLinks'

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

  const company = catalog?.companies.find((c) => c.id === interview?.company_id)
  const roundLabel = (r: RoundId) => company?.rounds.find((x) => x.id === r)?.label ?? catalog?.rounds.find((x) => x.id === r)?.label ?? r
  const title = !interview ? 'Interview' : sessionTitle(interview, roundLabel, catalog?.companies)
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

        {error && <p className="text-bad">{error}</p>}

        {(!res || res.status === 'generating') && !error && (
          <div className="space-y-5">
          <Card className="text-center py-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft text-accent-deep px-3 py-1 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" /> Grading your answers
            </span>
            <p className="font-semibold mt-3">Preparing your report…</p>
            <p className="text-sm text-muted mt-1">Our AI coach is reviewing each of your answers. This usually takes under a minute.</p>
            <p className="font-display text-xl text-blush-ink bg-blush rounded-xl px-4 py-3 mt-6 max-w-md mx-auto">“{thoughtOfTheDay()}”</p>
          </Card>
          <ReportSkeleton />
          </div>
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

        {res?.status === 'ready' && <ReportView report={res.report} hideScores={hideScores} roundLabel={roundLabel} turns={interview?.turns ?? []}
          share={interview ? resultShare(res.report, title, interview.context?.roleLabel ?? null, me?.full_name ?? null, interview.context?.experienceLabel ?? null, roundLabel) : null} />}
    </div>
  )
}

function ReportView({ report, hideScores, roundLabel, turns, share }: { report: Report; hideScores: boolean; roundLabel: (r: RoundId) => string; turns: InterviewTurn[]; share: ShareData | null }) {
  const speechBySeq = new Map(turns.map((t) => [t.seq, t.speech]))
  return (
    <div className="space-y-4 mt-6 pb-10">
      {/* Overall */}
      <section className="bg-card border border-line rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-center">
        {!hideScores && report.overallScore !== null && <ScoreRing value={report.overallScore} />}
        <div className="flex-1">
          <p className="text-ink leading-relaxed"><Rich text={report.summary} /></p>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <p className="text-xs text-muted">{report.answeredCount} answered · {report.skippedCount} skipped</p>
            {!hideScores && share && <ShareButton data={share} />}
          </div>
        </div>
      </section>

      {/* Strengths and improvements */}
      <div className="grid sm:grid-cols-2 gap-4">
        <ListCard title="What went well" icon="check" items={report.strengths} tone="good" />
        <ListCard title="What to work on" icon="target" items={report.improvements} tone="warn" />
      </div>

      <SpeakingCoach turns={turns} />

      {/* Company-style interviews: how the answers compare with that company's publicly reported bar */}
      {report.companyFit && (
        <section className="rounded-2xl border border-line bg-card p-6">
          <p className="text-xs font-semibold tracking-[0.18em] text-lavender-ink">The {report.companyFit.company} bar</p>
          <p className="text-ink mt-2 leading-relaxed"><Rich text={report.companyFit.verdict} /></p>
          {report.companyFit.tips.length > 0 && (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {report.companyFit.tips.map((t, i) => (
                <li key={i} className="rounded-xl bg-card/80 p-3 text-sm flex gap-2">
                  <Icon name="target" size={16} className="text-accent shrink-0 mt-0.5" /><span><Rich text={t} /></span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted mt-4">Practice feedback only. It doesn't predict a real hiring decision, and ReadyForRound isn't affiliated with {report.companyFit.company}.</p>
        </section>
      )}

      {/* Study next */}
      {report.studyNext.length > 0 && (
        <section className="bg-card border border-line rounded-2xl p-6">
          <h2 className="font-display font-semibold text-2xl text-ink flex items-center gap-2"><Icon name="book" size={18} className="text-accent" /> Study next</h2>
          <ol className="mt-3 space-y-3">
            {report.studyNext.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-6 h-6 shrink-0 rounded-full bg-accent-soft text-accent-deep text-sm font-semibold flex items-center justify-center">{i + 1}</span>
                <span className="min-w-0">
                  <b className="text-ink"><Rich text={s.topic} /></b>{s.why && <span className="text-soft">: <Rich text={s.why} /></span>}
                  <ResourceLinks topic={s.topic.replace(/`/g, '')} context={s.why} className="mt-2" />
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Question by question */}
      <h2 className="font-bold text-ink pt-2">Question by question</h2>
      {report.questions.map((q) => <QuestionCard key={q.seq} q={q} hideScores={hideScores} roundLabel={roundLabel} speech={speechBySeq.get(q.seq)} />)}

      <p className="text-xs text-muted leading-relaxed">
        This feedback was written by AI against a fixed scoring guide. Scores are estimates to help you practise.
        They are not an employer's decision and don't predict whether you will be hired.
      </p>
    </div>
  )
}

function QuestionCard({ q, hideScores, roundLabel, speech }: { q: QuestionFeedback; hideScores: boolean; roundLabel: (r: RoundId) => string; speech?: SpeechStats | null }) {
  const [showAnswer, setShowAnswer] = useState(false)
  return (
    <section className="bg-card border border-line rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-accent-deep font-medium">
            {roundLabel(q.round)}{q.skill ? ` · ${q.skill}` : ''}
          </p>
          <p className="font-semibold text-ink mt-1"><Rich text={q.question} /></p>
          {speech && !q.skipped && <SpeechLine speech={speech} />}
        </div>
        {q.skipped
          ? <span className="shrink-0 text-xs bg-raised text-soft rounded-full px-2 py-1">Skipped</span>
          : !hideScores && q.score !== null && <ScoreChip score={q.score} />}
      </div>

      {!q.skipped && (
        <div className="mt-4 space-y-3 text-sm">
          <div>
            <p className="font-medium text-accent-deep">What went well</p>
            <p className="text-soft mt-0.5"><Rich text={q.wentWell} /></p>
          </div>
          {q.missing.length > 0 && (
            <div>
              <p className="font-medium text-warn">What was missing</p>
              <ul className="list-disc pl-5 text-soft mt-0.5 space-y-0.5">
                {q.missing.map((m, i) => <li key={i}><Rich text={m} /></li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {q.betterAnswer && (
        <div className="mt-4">
          <button onClick={() => setShowAnswer(!showAnswer)} className="text-sm text-accent-deep font-medium">
            {showAnswer ? '▾ Hide' : '▸ Show'} one strong way to answer
          </button>
          {showAnswer && <p className="text-sm text-soft bg-accent-soft rounded-lg p-3 mt-2 leading-relaxed"><Rich text={q.betterAnswer} /></p>}
        </div>
      )}

      {q.confidence === 'low' && !q.skipped && (
        <p className="text-xs text-muted mt-3">Our AI coach was less sure about this grade.</p>
      )}
    </section>
  )
}

function ScoreChip({ score }: { score: number }) {
  const tone = score >= 7 ? 'bg-good-soft text-good' : score >= 4 ? 'bg-warn-soft text-warn' : 'bg-bad-soft text-bad'
  return <span className={`shrink-0 text-sm font-semibold rounded-full px-3 py-1 ${tone}`}>{score}/10</span>
}

function ScoreRing({ value }: { value: number }) {
  const r = 42
  const circumference = 2 * Math.PI * r
  const color = value >= 70 ? 'var(--good)' : value >= 40 ? 'var(--warn)' : 'var(--bad)'
  return (
    <div className="relative w-28 h-28 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" style={{ stroke: 'var(--hover)' }} strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" style={{ stroke: color }} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={circumference * (1 - value / 100)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-semibold leading-none text-ink">{value}</span>
        <span className="text-xs text-muted">out of 100</span>
      </div>
    </div>
  )
}

function ListCard({ title, icon, items, tone }: { title: string; icon: IconName; items: string[]; tone: 'good' | 'warn' }) {
  return (
    <section className={`bg-card border border-line rounded-2xl p-6 border-t-4 ${tone === 'good' ? 'border-good' : 'border-warn'}`}>
      <h2 className="font-display font-semibold text-2xl text-ink flex items-center gap-2"><Icon name={icon} size={18} className={tone === 'good' ? 'text-good' : 'text-warn'} /> {title}</h2>
      <ul className="mt-3 space-y-2 text-sm text-soft">
        {items.map((s, i) => <li key={i}><Rich text={s} /></li>)}
      </ul>
    </section>
  )
}

// The AI writes code words between backticks, like `useEffect`. Show those as small code chips instead of raw backticks.
function Rich({ text }: { text: string }) {
  const parts = text.split(/`([^`]+)`/)
  return <>{parts.map((part, i) => i % 2 === 1
    ? <code key={i} className="tabular-nums text-[0.88em] bg-raised border border-line rounded px-1 py-px">{part}</code>
    : part)}</>
}

// The share card for one interview's result
function resultShare(report: Report, title: string, role: string | null, name: string | null, detail: string | null, roundLabel: (r: RoundId) => string): ShareData | null {
  // Only good results get a share button: a low score is for learning, not posting
  if (report.overallScore === null || report.overallScore < 50) return null
  // Average question score (out of 10) per round, shown out of 100
  const byRound = new Map<RoundId, number[]>()
  for (const q of report.questions) if (!q.skipped && q.score !== null) byRound.set(q.round, [...(byRound.get(q.round) ?? []), q.score])
  const rounds = [...byRound.entries()].map(([r, xs]) => ({ label: roundLabel(r), score: Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) }))
  return {
    kicker: 'Mock interview result',
    headline: role ? `${title} · ${role}` : title,
    score: report.overallScore,
    scoreLabel: 'out of 100',
    percent: false,
    name,
    detail,
    chips: [`${report.answeredCount} question${report.answeredCount === 1 ? '' : 's'} answered`, 'AI feedback'],
    rounds: rounds.length > 1 ? rounds : [],
    caption: `Just finished a mock interview (${title})${role ? ` for ${role}` : ''}: ${report.overallScore}/100.\n\nEvery practice round shows me something specific to fix before the real one. Today it was: ${(report.improvements[0] ?? 'structuring my answers better').replace(/`/g, '')}`,
  }
}
