import { useEffect, useState } from 'react'
import { Select } from '../components/Select'
import { Link } from 'react-router'
import { apiFetch } from '../lib/api'
import { sessionTitle } from '../lib/sessions'
import { useMe } from '../auth/MeProvider'
import { ButtonLink, Card, EmptyState, PageHeader, ScoreChip } from '../components/ui'
import type { GoalWithStats, RoundId, SessionSummary } from '../types'
import { ListSkeleton } from '../components/Skeleton'

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

  if (error) return <p className="text-bad">{error}</p>
  if (!reports || !catalog || !me) return <ListSkeleton label="Loading your reports" />

  const roundLabel = (r: RoundId) => catalog.rounds.find((x) => x.id === r)?.label ?? r
  const goalName = (id: string | null) => {
    const g = goals.find((x) => x.id === id)
    return g ? `${label('roles', g.target_role)} · ${label('companyTypes', g.company_type)}` : 'No goal'
  }
  const activeId = me.active_goal?.id ?? null
  const shown = reports.filter((r) => goalFilter === 'all' || r.goal_id === (goalFilter === 'active' ? activeId : goalFilter))
  // Oldest first, for the trend
  const graded = shown.filter((r) => r.score !== null).reverse().map((r) => ({
    id: r.id,
    score: r.score!,
    label: r.mode === 'complete' ? 'Complete' : r.job_title ? 'Job ad' : roundLabel(r.rounds[0]),
    date: new Date(r.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
  }))

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Reports" title="Your feedback history"
        actions={
          <div className="flex items-center gap-2 text-sm text-muted">
            Goal
            <Select label="Show reports for" value={goalFilter} onChange={setGoalFilter} className="w-60"
              options={[
                { value: 'active', label: 'Current goal' },
                { value: 'all', label: 'All goals' },
                ...goals.filter((g) => g.id !== activeId).map((g) => ({ value: g.id, label: goalName(g.id), hint: g.status === 'achieved' ? 'Achieved' : 'Paused' })),
              ]} />
          </div>
        } />

      {shown.length === 0 ? (
        <EmptyState title="No reports yet" body="Finish an interview and your feedback report will appear here."
          action={<ButtonLink to="/practice">Start an interview</ButtonLink>} />
      ) : (
        <>
          {graded.length >= 2 && !me.practice_without_score && <Trend items={graded} />}
          <Card className="p-0 sm:p-0 overflow-hidden">
            <ul>
              {shown.map((r) => (
                <li key={r.id} className="border-t border-line first:border-t-0">
                  <Link to={`/interview/${r.id}/report`} className="flex items-center gap-4 px-5 sm:px-6 min-h-16 hover:bg-raised">
                    <span className="flex-1 min-w-0">
                      <span className="block font-medium truncate">{r.mode === 'complete' && !r.company_id ? `Complete interview · ${r.rounds.map(roundLabel).join(' → ')}` : sessionTitle(r, roundLabel, catalog.companies)}</span>
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

// Scores over time as columns: one per interview, coloured by how it went, with the score on top.
type TrendItem = { id: string; score: number; label: string; date: string }
const tone = (s: number) => (s >= 70 ? { bar: 'bg-good', text: 'text-good' } : s >= 40 ? { bar: 'bg-warn', text: 'text-warn' } : { bar: 'bg-bad', text: 'text-bad' })

function Trend({ items: all }: { items: TrendItem[] }) {
  const [grown, setGrown] = useState(false)
  useEffect(() => { const id = requestAnimationFrame(() => requestAnimationFrame(() => setGrown(true))); return () => cancelAnimationFrame(id) }, [])
  const items = all.slice(-12) // the latest 12 fit nicely
  const scores = all.map((i) => i.score)
  const latest = scores[scores.length - 1]
  const best = Math.max(...scores)
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  const change = latest - scores[0]
  const stats: [string, string, string][] = [
    ['Latest', `${latest}`, tone(latest).text],
    ['Best', `${best}`, 'text-good'],
    ['Average', `${avg}`, 'text-ink'],
    ['Since first', `${change >= 0 ? '+' : ''}${change}`, change >= 0 ? 'text-good' : 'text-warn'],
  ]
  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-semibold">Your scores</h2>
          <p className="text-sm text-muted mt-0.5">Each column is one interview, oldest on the left. Tap one to open its report.</p>
        </div>
        <div className="flex gap-2">
          {stats.map(([k, v, c]) => (
            <div key={k} className="rounded-xl bg-raised px-3.5 py-2 text-center min-w-18">
              <p className={`text-lg font-bold tabular-nums leading-tight ${c}`}>{v}</p>
              <p className="text-[11px] text-muted">{k}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative overflow-x-auto [scrollbar-width:thin]">
        <div className="relative h-60 min-w-fit" style={{ minWidth: items.length * 64 }}>
          {/* guide lines at 0, 50 and 100, and the average */}
          {[100, 50].map((v) => (
            <div key={v} className="absolute inset-x-0 border-t border-line" style={{ bottom: `${(v / 100) * 168 + 44}px` }}>
              <span className="absolute -top-2.5 left-0 text-[10px] text-subtle bg-card pr-1">{v}</span>
            </div>
          ))}
          <div className="absolute inset-x-0 border-t-2 border-dashed border-accent/40 transition-all duration-700" style={{ bottom: `${(avg / 100) * 168 + 44}px` }}>
            <span className="absolute -top-5 right-0 text-[10px] font-semibold text-accent-deep bg-card px-1">avg {avg}</span>
          </div>
          <ol className="absolute inset-0 flex items-end gap-2 sm:gap-3 pl-7 pb-0">
            {items.map((it, i) => (
              <li key={it.id} className="flex-1 min-w-12 h-full">
                <Link to={`/interview/${it.id}/report`} className="group h-full flex flex-col justify-end items-center" title={`${it.label} · ${it.date}: ${it.score}/100`}>
                  <span className={`text-xs font-bold tabular-nums mb-1 transition-opacity duration-500 ${tone(it.score).text} ${grown ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: `${300 + i * 50}ms` }}>{it.score}</span>
                  <span className={`w-full max-w-11 rounded-t-md ${tone(it.score).bar} group-hover:opacity-85 transition-all duration-700 ease-out motion-reduce:transition-none`}
                    style={{ height: grown ? `${Math.max(3, (it.score / 100) * 168)}px` : 0, transitionDelay: `${i * 50}ms` }} />
                  <span className="h-11 pt-1.5 flex flex-col items-center text-center leading-tight">
                    <span className="text-[11px] font-medium text-soft truncate max-w-16">{it.label}</span>
                    <span className="text-[10px] text-muted">{it.date}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Card>
  )
}
