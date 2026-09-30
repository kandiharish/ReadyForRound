import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { apiFetch } from '../lib/api'
import { sessionTitle } from '../lib/sessions'
import { useMe } from '../auth/MeProvider'
import { ButtonLink, Card, EmptyState, PageHeader, ScoreChip, Spinner } from '../components/ui'
import type { GoalWithStats, RoundId, SessionSummary } from '../types'

// Every finished interview, newest first, filterable by goal.
export default function Reports() {
  const { me, catalog, label } = useMe()
  const [reports, setReports] = useState<SessionSummary[] | null>(null)
  const [goals, setGoals] = useState<GoalWithStats[]>([])
  const [goalFilter, setGoalFilter] = useState<string>('active')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([apiFetch<SessionSummary[]>('/reports'), apiFetch<GoalWithStats[]>('/goals')])
      .then(([r, g]) => { setReports(r); setGoals(g) })
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <p className="text-rose">{error}</p>
  if (!reports || !catalog || !me) return <Spinner />

  const roundLabel = (r: RoundId) => catalog.rounds.find((x) => x.id === r)?.label ?? r
  const goalName = (id: string | null) => {
    const g = goals.find((x) => x.id === id)
    return g ? `${label('roles', g.target_role)} · ${label('companyTypes', g.company_type)}` : 'No goal'
  }
  const activeId = me.active_goal?.id ?? null
  const shown = reports.filter((r) => goalFilter === 'all' || r.goal_id === (goalFilter === 'active' ? activeId : goalFilter))
  const scores = shown.filter((r) => r.score !== null).map((r) => r.score!).reverse() // oldest first, for the trend

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Reports" title="Your feedback history"
        actions={
          <label className="flex items-center gap-2 text-sm text-muted">
            Goal
            <select value={goalFilter} onChange={(e) => setGoalFilter(e.target.value)}
              className="min-h-11 rounded-xl bg-ink-800 border border-line-strong px-3 text-fg">
              <option value="active">Current goal</option>
              <option value="all">All goals</option>
              {goals.filter((g) => g.id !== activeId).map((g) => <option key={g.id} value={g.id}>{goalName(g.id)}</option>)}
            </select>
          </label>
        } />

      {shown.length === 0 ? (
        <EmptyState title="No reports yet" body="Finish an interview and your feedback report will appear here."
          action={<ButtonLink to="/practice">Start an interview</ButtonLink>} />
      ) : (
        <>
          {scores.length >= 2 && !me.practice_without_score && <Trend scores={scores} />}
          <Card className="p-0 sm:p-0 overflow-hidden">
            <ul>
              {shown.map((r) => (
                <li key={r.id} className="border-t border-line first:border-t-0">
                  <Link to={`/interview/${r.id}/report`} className="flex items-center gap-4 px-5 sm:px-6 min-h-16 hover:bg-ink-750">
                    <span className="flex-1 min-w-0">
                      <span className="block font-medium truncate">{r.mode === 'complete' ? `Complete interview · ${r.rounds.map(roundLabel).join(' → ')}` : sessionTitle(r, roundLabel)}</span>
                      <span className="block text-xs text-muted mt-0.5">
                        {new Date(r.created_at).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        {r.status === 'ended_early' ? ' · ended early' : ''}
                        {goalFilter === 'all' ? ` · ${goalName(r.goal_id)}` : ''}
                      </span>
                    </span>
                    {r.score !== null
                      ? (me.practice_without_score ? <span className="text-xs text-muted">View</span> : <ScoreChip score={r.score} />)
                      : <span className="text-xs text-muted">{r.reportStatus === 'generating' ? 'Preparing…' : r.reportStatus === 'failed' ? 'Needs retry' : 'No answers'}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  )
}

// A small line chart of scores over time.
function Trend({ scores }: { scores: number[] }) {
  const w = 600
  const h = 120
  const step = w / (scores.length - 1)
  const points = scores.map((s, i) => `${i * step},${h - (s / 100) * h}`).join(' ')
  const change = scores[scores.length - 1] - scores[0]
  return (
    <Card>
      <div className="flex justify-between items-baseline">
        <h2 className="font-semibold">Score trend</h2>
        <span className={`text-sm ${change >= 0 ? 'text-lime' : 'text-amber'}`}>{change >= 0 ? '+' : ''}{change} since your first interview here</span>
      </div>
      <svg viewBox={`-6 -6 ${w + 12} ${h + 12}`} className="w-full h-32 mt-4" role="img" aria-label={`Scores over time, from ${scores[0]} to ${scores[scores.length - 1]}`}>
        {[0, 50, 100].map((v) => <line key={v} x1="0" x2={w} y1={h - (v / 100) * h} y2={h - (v / 100) * h} stroke="#1f2430" />)}
        <polyline points={points} fill="none" stroke="#c6f36b" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {scores.map((s, i) => <circle key={i} cx={i * step} cy={h - (s / 100) * h} r="4" fill="#0b0d12" stroke="#c6f36b" strokeWidth="2" />)}
      </svg>
    </Card>
  )
}
