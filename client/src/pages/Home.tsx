import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { apiFetch } from '../lib/api'
import { sessionTitle, startDrill } from '../lib/sessions'
import { useMe } from '../auth/MeProvider'
import { Bar, Button, ButtonLink, Card, EmptyState, Icon, PageHeader, ScoreChip, ScoreRing } from '../components/ui'
import type { HomeStats, Interview, RoundId } from '../types'
import { StoriesRow } from '../components/Stories'
import { thoughtOfTheDay } from '../lib/inspiration'
import { HomeSkeleton } from '../components/Skeleton'
import { ShareButton, type ShareData } from '../components/ShareCard'

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

  if (error) return <p className="text-bad">{error}</p>
  if (!stats || !catalog || !me) return <HomeSkeleton />

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
        <PageHeader eyebrow={today} title={firstName ? `${greeting}, ${firstName}` : greeting} />
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
      <PageHeader eyebrow={today} title={firstName ? `${greeting}, ${firstName}` : greeting}
        actions={
          <span className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-peach text-peach-ink text-sm">
            <Icon name="flame" size={16} />
            <b className="font-semibold">{stats.streak.days}-day</b><span className="text-muted">streak</span>
          </span>
        } />

      {actionError && <p className="rounded-xl border border-warn/40 bg-warn-soft px-4 py-3 text-sm text-warn" role="alert">{actionError}</p>}

      {stats.inProgress && (
        <Link to={`/interview/${stats.inProgress.id}`} className="flex items-center justify-between gap-4 rounded-2xl bg-sky text-sky-ink px-5 py-4 hover:opacity-90">
          <span className="text-sm"><b className="font-semibold">You have an unfinished interview.</b> Pick up where you left off.</span>
          <Icon name="arrow" />
        </Link>
      )}

      {/* Thought for today: a calm, positive line that changes daily */}
      <section className="relative overflow-hidden rounded-2xl bg-blush text-blush-ink px-6 py-5 flex items-center gap-5">
        <span aria-hidden="true" className="font-display text-7xl leading-none -mt-4 opacity-50 select-none">“</span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">Thought for today</p>
          <p className="font-display font-semibold text-2xl sm:text-[1.7rem] leading-snug mt-1">{thoughtOfTheDay()}</p>
        </div>
      </section>

      <StoriesRow />

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
                  <span className={`inline-flex items-center gap-1.5 text-sm ${stats.readiness.delta >= 0 ? 'text-accent-deep' : 'text-warn'}`}>
                    <Icon name={stats.readiness.delta >= 0 ? 'up' : 'down'} size={14} strokeWidth={2.4} />
                    {stats.readiness.delta >= 0 ? '+' : ''}{stats.readiness.delta} vs your earlier interviews
                  </span>
                ) : (
                  <span className="text-sm text-muted">{stats.readiness.graded === 0 ? 'Do an interview to see your score' : 'Based on your latest interviews'}</span>
                )}
                {stats.readiness.score !== null && <ShareButton data={progressShare(stats, label('roles', goal.target_role), me.full_name, label('experienceLevels', me.experience_level), roundLabel)} />}
              </>
            )}
          </div>
          <div className="flex-1 min-w-36 flex flex-col justify-center gap-4">
            {stats.roundScores.map((r) => (
              <div key={r.round} className="space-y-1.5">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-soft">{roundLabel(r.round)}</span>
                  <span className={`font-mono whitespace-nowrap ${r.score === null ? 'text-xs text-muted' : ''}`}>{r.score === null ? 'not tried' : hideScores ? '✓' : r.score}</span>
                </div>
                <Bar value={r.score ?? 0} />
              </div>
            ))}
          </div>
        </Card>

        {/* The most important card: a soft lavender-to-sky glow that suits both themes */}
        <section className="relative overflow-hidden rounded-2xl bg-card text-ink border border-line p-6 flex flex-col shadow-sm order-first lg:order-none">
          <span className="relative self-start rounded-full bg-card/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-lavender-ink">Up next for you</span>
          <h2 className="relative font-display font-semibold text-4xl leading-none mt-4">{recTitle}</h2>
          <p className="relative text-sm mt-3 text-soft leading-relaxed">{rec.reason}</p>
          {interviewsLeft <= 0 && <p className="relative text-sm mt-2 font-semibold">You've used today's {stats.usage.interviews.limit} interviews. Try a drill, or come back tomorrow.</p>}
          <div className="flex-1 min-h-4" />
          <div className="flex flex-wrap gap-2">
            <Button onClick={startRecommended} disabled={starting || interviewsLeft <= 0} className="relative">
              <Icon name="play" size={16} /> {starting ? 'Preparing…' : 'Start interview'}
            </Button>
            <Link to="/practice" className="relative inline-flex items-center min-h-11 px-4 rounded-xl border border-line-strong bg-card/60 text-sm font-medium text-ink hover:bg-card">Choose another</Link>
          </div>
        </section>

        <Card className="flex flex-col gap-4">
          <span className="text-sm text-muted">This week</span>
          <div className="flex justify-between">
            {stats.streak.week.map((d, i) => (
              <div key={d.date} className="flex flex-col items-center gap-1.5">
                <span className={`w-6 h-6 rounded-full ${d.done ? 'bg-accent' : d.isToday ? 'border-2 border-dashed border-accent' : 'bg-hover'}`}
                  aria-label={`${d.date}: ${d.done ? 'practised' : 'not practised'}`} />
                <span className="text-[11px] text-subtle">{DAY_LETTERS[i]}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-soft">{stats.counts.thisWeek} session{stats.counts.thisWeek === 1 ? '' : 's'} in the last 7 days</p>
          <div className="rounded-xl bg-lavender text-lavender-ink p-3.5 space-y-2.5">
            <p className="text-xs flex items-center gap-1.5 opacity-90"><Icon name="bolt" size={13} /> 5-minute drill</p>
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
              <Link to="/goals" className="text-sm text-accent-deep">Set a target date</Link>
            )}
          </div>
        </Card>
      </div>

      {/* Row 2: skills · recent */}
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <div className="flex flex-wrap justify-between items-center gap-3">
            <h2 className="font-semibold flex items-center gap-2"><span className="w-7 h-7 rounded-lg bg-sage text-sage-ink flex items-center justify-center"><Icon name="target" size={15} /></span>Skills: what you claim vs what you prove</h2>
            <div className="flex gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm border-[1.5px] border-info" />You said</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-accent" />Proven</span>
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
                    <div className="h-1.5 rounded-full bg-hover overflow-hidden"><div className="h-full rounded-full border-[1.5px] border-info box-border" style={{ width: `${claim}%` }} /></div>
                    <div className="h-1.5 rounded-full bg-hover overflow-hidden"><div className="h-full rounded-full bg-accent" style={{ width: `${s.proven_score ?? 0}%` }} /></div>
                  </div>
                  <span className={`w-20 text-right font-mono text-xs ${gap === null ? 'text-subtle' : gap <= -20 ? 'text-bad' : 'text-muted'}`}>
                    {gap === null ? 'not tested' : hideScores ? 'tested' : gap > 0 ? `+${gap}` : gap}
                  </span>
                </div>
              )
            })}
          </div>
          <Link to="/profile" className="inline-block mt-4 text-sm text-accent-deep">Edit skills</Link>
        </Card>

        <Card>
          <div className="flex justify-between items-center">
            <h2 className="font-semibold flex items-center gap-2"><span className="w-7 h-7 rounded-lg bg-sky text-sky-ink flex items-center justify-center"><Icon name="reports" size={15} /></span>Recent interviews</h2>
            <Link to="/reports" className="text-sm text-accent-deep">All reports</Link>
          </div>
          {stats.recent.length === 0 ? (
            <p className="text-sm text-muted mt-4">No interviews for this goal yet. Your reports will appear here.</p>
          ) : (
            <ul className="mt-2">
              {stats.recent.map((s) => (
                <li key={s.id} className="border-t border-line first:border-t-0">
                  <Link to={`/interview/${s.id}/report`} className="flex items-center gap-3 min-h-12 hover:text-accent-deep">
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium truncate">{sessionTitle(s, roundLabel, catalog.companies)}</span>
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

// The share card for overall progress towards the current goal
function progressShare(stats: HomeStats, role: string, name: string | null, detail: string, roundLabel: (r: RoundId) => string): ShareData {
  const n = stats.counts.total
  const score = stats.readiness.score ?? 0
  return {
    kicker: 'Mock interview progress',
    headline: `Getting interview-ready for ${role}`,
    score,
    scoreLabel: 'interview-ready',
    percent: true,
    name,
    detail,
    chips: [
      `${n} interview${n === 1 ? '' : 's'}`,
      ...(stats.streak.days > 1 ? [`${stats.streak.days}-day streak`] : []),
      ...(stats.counts.drills > 0 ? [`${stats.counts.drills} drill${stats.counts.drills === 1 ? '' : 's'}`] : []),
    ],
    rounds: stats.roundScores.filter((r): r is { round: RoundId; score: number } => r.score !== null).map((r) => ({ label: roundLabel(r.round), score: r.score })),
    caption: `Interview prep update: ${score}% interview-ready for ${role} after ${n} mock interview${n === 1 ? '' : 's'}.\n\nThe biggest lesson so far: knowing an answer and explaining it clearly out loud, under time pressure, are two different skills. Practising the second one is what moves the number.`,
  }
}
