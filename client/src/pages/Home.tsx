import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { apiFetch } from '../lib/api'
import { sessionTitle, startDrill } from '../lib/sessions'
import { useMe } from '../auth/MeProvider'
import { Bar, Button, ButtonLink, Card, EmptyState, Icon, PageHeader, ScoreChip, ScoreRing, Spinner } from '../components/ui'
import type { HomeStats, Interview, RoundId } from '../types'

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function Home() {
  const navigate = useNavigate()
  const { me, catalog, label, refreshUsage } = useMe()
  const [stats, setStats] = useState<HomeStats | null>(null)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null) // the page couldn't load
  const [actionError, setActionError] = useState<string | null>(null) // e.g. daily limit reached

  useEffect(() => {
    apiFetch<HomeStats>('/home').then(setStats).catch((e) => setError(e.message))
  }, [])

  if (error) return <p className="text-rose">{error}</p>
  if (!stats || !catalog || !me) return <Spinner />

  const roundLabel = (r: RoundId) => catalog.rounds.find((x) => x.id === r)?.label ?? r
  const hideScores = me.practice_without_score
  const goal = stats.goal
  const firstName = (me.full_name ?? '').split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })

  if (!goal) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow={today} title={`${greeting}, ${firstName}`} />
        <EmptyState title="Choose what you're preparing for"
          body="Your interviews, reports and progress are organised around a goal, like 'Frontend Developer at a product company'."
          action={<ButtonLink to="/goals">Create a goal</ButtonLink>} />
      </div>
    )
  }

  const rec = stats.recommendation
  const interviewsLeft = stats.usage.interviews.limit - stats.usage.interviews.used
  const drillsLeft = stats.usage.drills.limit - stats.usage.drills.used
  const recTitle = rec.mode === 'complete' ? 'Complete interview' : `${roundLabel(rec.round!)} round`

  async function startRecommended() {
    setStarting(true)
    setActionError(null)
    try {
      const body = rec.mode === 'complete' ? { mode: 'complete' } : { mode: 'single', round: rec.round }
      const iv = await apiFetch<Interview>('/interviews', { method: 'POST', body: JSON.stringify(body) })
      refreshUsage()
      navigate(`/interview/${iv.id}`)
    } catch (err) {
      setActionError((err as Error).message)
      setStarting(false)
    }
  }

  async function drill() {
    setStarting(true)
    setActionError(null)
    try {
      const iv = await startDrill(stats!.drillTopic ?? 'Core concepts for your role')
      refreshUsage()
      navigate(`/interview/${iv.id}`)
    } catch (err) {
      setActionError((err as Error).message)
      setStarting(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow={today} title={`${greeting}, ${firstName}`}
        actions={
          <span className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-ink-800 border border-line text-sm">
            <Icon name="flame" size={16} className="text-amber" />
            <b className="font-semibold">{stats.streak.days}-day</b><span className="text-muted">streak</span>
          </span>
        } />

      {actionError && <p className="rounded-xl border border-amber/40 bg-amber-deep px-4 py-3 text-sm text-amber" role="alert">{actionError}</p>}

      {stats.inProgress && (
        <Link to={`/interview/${stats.inProgress.id}`} className="flex items-center justify-between gap-4 rounded-2xl border border-sky/40 bg-sky/10 px-5 py-4 hover:bg-sky/15">
          <span className="text-sm"><b className="font-semibold">You have an unfinished interview.</b> <span className="text-soft">Pick up where you left off.</span></span>
          <Icon name="arrow" className="text-sky" />
        </Link>
      )}

      {/* Row 1: readiness · up next · daily habit */}
      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr_0.85fr]">
        <Card className="flex flex-col sm:flex-row gap-6">
          <div className="flex flex-col gap-3 items-start">
            <span className="text-sm text-muted">Readiness · {label('roles', goal.target_role)}</span>
            {hideScores ? (
              <p className="text-sm text-soft max-w-44">Scores are hidden in practice mode. Keep going, your reports show what to work on.</p>
            ) : (
              <>
                <ScoreRing value={stats.readiness.score} />
                {stats.readiness.delta !== null ? (
                  <span className={`inline-flex items-center gap-1.5 text-sm ${stats.readiness.delta >= 0 ? 'text-lime' : 'text-amber'}`}>
                    <Icon name={stats.readiness.delta >= 0 ? 'up' : 'down'} size={14} strokeWidth={2.4} />
                    {stats.readiness.delta >= 0 ? '+' : ''}{stats.readiness.delta} vs your earlier interviews
                  </span>
                ) : (
                  <span className="text-sm text-muted">{stats.readiness.graded === 0 ? 'Do an interview to see your score' : 'Based on your latest interviews'}</span>
                )}
              </>
            )}
          </div>
          <div className="flex-1 flex flex-col justify-center gap-4">
            {stats.roundScores.map((r) => (
              <div key={r.round} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-soft">{roundLabel(r.round)}</span>
                  <span className="font-mono">{r.score === null ? 'not tried' : hideScores ? '✓' : r.score}</span>
                </div>
                <Bar value={r.score ?? 0} />
              </div>
            ))}
          </div>
        </Card>

        <section className="rounded-2xl bg-lime text-ink-900 p-6 flex flex-col">
          <span className="self-start text-xs font-semibold bg-ink-900 text-lime rounded-full px-2.5 py-1">Up next for you</span>
          <h2 className="font-display text-4xl leading-none mt-4">{recTitle}</h2>
          <p className="text-sm mt-3 text-[#28301a] leading-relaxed">{rec.reason}</p>
          {interviewsLeft <= 0 && <p className="text-sm mt-2 font-semibold">You've used today's {stats.usage.interviews.limit} interviews. Try a drill, or come back tomorrow.</p>}
          <div className="flex-1 min-h-4" />
          <div className="flex flex-wrap gap-2">
            <Button variant="dark" onClick={startRecommended} disabled={starting || interviewsLeft <= 0}>
              <Icon name="play" size={16} /> {starting ? 'Preparing…' : 'Start interview'}
            </Button>
            <Link to="/practice" className="inline-flex items-center min-h-11 px-4 rounded-xl border-[1.5px] border-ink-900 text-sm font-medium hover:bg-ink-900/10">Choose another</Link>
          </div>
        </section>

        <Card className="flex flex-col gap-4">
          <span className="text-sm text-muted">This week</span>
          <div className="flex justify-between">
            {stats.streak.week.map((d, i) => (
              <div key={d.date} className="flex flex-col items-center gap-1.5">
                <span className={`w-6 h-6 rounded-full ${d.done ? 'bg-lime' : d.isToday ? 'border-2 border-dashed border-lime' : 'bg-[#232838]'}`}
                  aria-label={`${d.date}: ${d.done ? 'practised' : 'not practised'}`} />
                <span className="text-[11px] text-subtle">{DAY_LETTERS[i]}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-soft">{stats.counts.thisWeek} session{stats.counts.thisWeek === 1 ? '' : 's'} in the last 7 days</p>
          <div className="rounded-xl bg-ink-750 border border-line-strong p-3.5 space-y-2.5">
            <p className="text-xs text-muted flex items-center gap-1.5"><Icon name="bolt" size={13} className="text-lime" /> 5-minute drill</p>
            <p className="text-sm font-medium leading-snug">{stats.drillTopic}</p>
            <Button variant="secondary" className="w-full min-h-10" onClick={drill} disabled={starting || drillsLeft <= 0}>
              {drillsLeft <= 0 ? 'No drills left today' : 'Start drill'}
            </Button>
          </div>
          <div className="flex-1" />
          <div className="border-t border-line pt-3 flex items-baseline gap-2">
            {stats.daysLeft !== null && stats.daysLeft >= 0 ? (
              <><span className="font-mono text-2xl font-semibold">{stats.daysLeft}</span><span className="text-sm text-muted">days to your target date</span></>
            ) : (
              <Link to="/goals" className="text-sm text-lime">Set a target date</Link>
            )}
          </div>
        </Card>
      </div>

      {/* Row 2: skills · recent */}
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <div className="flex flex-wrap justify-between items-center gap-3">
            <h2 className="font-semibold">Skills: what you claim vs what you prove</h2>
            <div className="flex gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm border-[1.5px] border-sky" />You said</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-lime" />Proven</span>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {stats.skills.map((s) => {
              const claim = s.self_rating * 20
              const gap = s.proven_score === null ? null : s.proven_score - claim
              return (
                <div key={s.skill} className="flex items-center gap-4">
                  <span className="w-24 text-sm text-soft truncate">{s.skill}</span>
                  <div className="flex-1 space-y-1">
                    <div className="h-1.5 rounded-full bg-[#1a1e28] overflow-hidden"><div className="h-full rounded-full border-[1.5px] border-sky box-border" style={{ width: `${claim}%` }} /></div>
                    <div className="h-1.5 rounded-full bg-[#1a1e28] overflow-hidden"><div className="h-full rounded-full bg-lime" style={{ width: `${s.proven_score ?? 0}%` }} /></div>
                  </div>
                  <span className={`w-20 text-right font-mono text-xs ${gap === null ? 'text-subtle' : gap <= -20 ? 'text-rose' : 'text-muted'}`}>
                    {gap === null ? 'not tested' : hideScores ? 'tested' : gap > 0 ? `+${gap}` : gap}
                  </span>
                </div>
              )
            })}
          </div>
          <Link to="/profile" className="inline-block mt-4 text-sm text-lime">Edit skills</Link>
        </Card>

        <Card>
          <div className="flex justify-between items-center">
            <h2 className="font-semibold">Recent interviews</h2>
            <Link to="/reports" className="text-sm text-lime">All reports</Link>
          </div>
          {stats.recent.length === 0 ? (
            <p className="text-sm text-muted mt-4">No interviews for this goal yet. Your reports will appear here.</p>
          ) : (
            <ul className="mt-2">
              {stats.recent.map((s) => (
                <li key={s.id} className="border-t border-line first:border-t-0">
                  <Link to={`/interview/${s.id}/report`} className="flex items-center gap-3 min-h-12 hover:text-lime">
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium truncate">{sessionTitle(s, roundLabel)}</span>
                      <span className="block text-xs text-muted">{new Date(s.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}{s.status === 'ended_early' ? ' · ended early' : ''}</span>
                    </span>
                    {s.score !== null && !hideScores ? <ScoreChip score={s.score} /> : <span className="text-xs text-muted">{s.reportStatus === 'generating' ? 'Preparing…' : 'View'}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
