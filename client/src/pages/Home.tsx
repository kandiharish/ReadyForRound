import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { apiFetch } from '../lib/api'
import { sessionTitle, startDrill } from '../lib/sessions'
import { useMe } from '../auth/MeProvider'
import { Bar, Button, ButtonLink, EmptyState, Icon, PageHeader, ScoreChip } from '../components/ui'
import type { HomeStats, Interview, RoundId } from '../types'
import { GuidesList } from '../components/Stories'
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

  if (!goal) {
    return (
      <div className="space-y-6">
        <PageHeader title={firstName ? `${greeting}, ${firstName}` : greeting} />
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

  const role = label('roles', goal.target_role)
  const tested = stats.skills.length > 0

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h1 className="font-display font-semibold text-[1.75rem] leading-tight">{firstName ? `${greeting}, ${firstName}` : greeting}</h1>
        <p className="text-sm text-muted">
          {role} · {label('companyTypes', goal.company_type)}
          {stats.daysLeft !== null && stats.daysLeft >= 0 && <> · <span className="text-soft tabular-nums">{stats.daysLeft} days</span> to your target date</>}
        </p>
      </header>

      {actionError && <p className="rounded-lg border border-warn/40 bg-warn-soft px-4 py-3 text-sm text-warn" role="alert">{actionError}</p>}

      {stats.inProgress && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-card px-4 py-3">
          <span className="text-sm text-soft">You have an unfinished interview.</span>
          <ButtonLink to={`/interview/${stats.inProgress.id}`} variant="secondary" className="min-h-9">Resume</ButtonLink>
        </div>
      )}

      {/* The one thing to do next, with where you stand beside it */}
      <section className="rounded-xl border border-line bg-card grid lg:grid-cols-[1.1fr_1fr]">
        <div data-tour="next" className="p-6 sm:p-8 flex flex-col">
          <p className="text-sm text-muted">Next step</p>
          <h2 className="text-2xl font-semibold mt-1.5">{recTitle}</h2>
          <p className="text-soft mt-2 leading-relaxed max-w-md">{rec.reason}</p>
          {interviewsLeft <= 0 && <p className="text-sm text-warn mt-3">You have used today's {stats.usage.interviews.limit} interviews. Try a drill, or come back tomorrow.</p>}
          <div className="flex-1 min-h-6" />
          <div className="flex flex-wrap gap-2">
            <Button onClick={startRecommended} disabled={starting || interviewsLeft <= 0}>
              <Icon name="play" size={15} /> {starting ? 'Preparing…' : 'Start interview'}
            </Button>
            <ButtonLink to="/practice" variant="ghost">Choose another</ButtonLink>
          </div>
        </div>

        <div data-tour="readiness" className="p-6 sm:p-8 border-t lg:border-t-0 lg:border-l border-line">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-sm text-muted">Readiness</p>
            {stats.readiness.score !== null && !hideScores && (
              <ShareButton data={progressShare(stats, role, me.full_name, label('experienceLevels', me.experience_level), roundLabel)} />
            )}
          </div>
          {hideScores ? (
            <p className="text-sm text-soft mt-2">Scores are hidden in practice mode. Your reports still show what to work on.</p>
          ) : (
            <div className="flex items-baseline gap-3 mt-1">
              {stats.readiness.score === null
                ? <span className="text-xl font-semibold text-soft">No score yet</span>
                : <span className="text-4xl font-semibold tabular-nums">{stats.readiness.score}%</span>}
              <span className={`text-sm ${stats.readiness.delta !== null && stats.readiness.delta < 0 ? 'text-warn' : 'text-muted'}`}>
                {stats.readiness.delta !== null
                  ? `${stats.readiness.delta >= 0 ? '+' : ''}${stats.readiness.delta} since earlier interviews`
                  : stats.readiness.graded === 0 ? 'after your first interview' : 'from your latest interviews'}
              </span>
            </div>
          )}
          <ul className="mt-5 space-y-3">
            {stats.roundScores.map((r) => (
              <li key={r.round} className="grid grid-cols-[7.5rem_1fr_2.5rem] items-center gap-3 text-sm">
                <span className="text-soft truncate">{roundLabel(r.round)}</span>
                <Bar value={r.score ?? 0} />
                <span className={`text-right tabular-nums ${r.score === null ? 'text-subtle' : 'text-ink'}`}>{r.score === null ? '-' : hideScores ? '✓' : r.score}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr]">
        {/* Recent interviews */}
        <section aria-labelledby="recent-title">
          <div className="flex items-baseline justify-between">
            <h2 id="recent-title" className="font-semibold">Recent interviews</h2>
            <Link to="/reports" className="text-sm text-accent-deep hover:underline">View all</Link>
          </div>
          {stats.recent.length === 0 ? (
            <p className="text-sm text-muted mt-3 border-t border-line pt-3">No interviews for this goal yet.</p>
          ) : (
            <ul className="mt-3">
              {stats.recent.map((s) => (
                <li key={s.id} className="border-t border-line">
                  <Link to={`/interview/${s.id}/report`} className="group flex items-center gap-4 min-h-13">
                    <span className="flex-1 min-w-0 text-sm text-ink truncate group-hover:text-accent-deep">{sessionTitle(s, roundLabel, catalog.companies)}</span>
                    <span className="text-xs text-muted whitespace-nowrap">{new Date(s.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}{s.status === 'ended_early' ? ' · ended early' : ''}</span>
                    {s.score !== null && !hideScores ? <ScoreChip score={s.score} /> : <span className="text-xs text-muted w-10 text-right">{s.reportStatus === 'generating' ? '…' : ''}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* This week + a quick drill */}
        <section aria-labelledby="week-title">
          <div className="flex items-baseline justify-between">
            <h2 id="week-title" className="font-semibold">This week</h2>
            <span className="text-sm text-muted tabular-nums">{stats.counts.thisWeek} session{stats.counts.thisWeek === 1 ? '' : 's'}{stats.streak.days > 1 ? ` · ${stats.streak.days}-day streak` : ''}</span>
          </div>
          <div className="mt-3 border-t border-line pt-4 grid grid-cols-7 gap-2">
            {stats.streak.week.map((d, i) => (
              <div key={d.date} className="flex flex-col items-center gap-1.5">
                <span className={`w-full h-8 rounded-md ${d.done ? 'bg-accent' : 'bg-raised'} ${d.isToday ? 'ring-1 ring-inset ring-line-strong' : ''}`}
                  aria-label={`${d.date}: ${d.done ? 'practised' : 'not practised'}`} />
                <span className={`text-[11px] ${d.isToday ? 'text-ink font-medium' : 'text-subtle'}`}>{DAY_LETTERS[i]}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-line pt-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-muted">5-minute drill</p>
              <p className="text-sm font-medium truncate mt-0.5">{stats.drillTopic}</p>
            </div>
            <Button variant="secondary" className="min-h-9 shrink-0" onClick={drill} disabled={starting || drillsLeft <= 0}>
              {drillsLeft <= 0 ? 'None left today' : 'Start'}
            </Button>
          </div>
        </section>
      </div>

      {/* Skills: what you said when you signed up vs what interviews have shown */}
      {tested && (
        <section aria-labelledby="skills-title">
          <div className="flex items-baseline justify-between">
            <h2 id="skills-title" className="font-semibold">Skills</h2>
            <Link to="/profile" className="text-sm text-accent-deep hover:underline">Edit skills</Link>
          </div>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted border-t border-line">
                <th scope="col" className="font-medium py-2.5">Skill</th>
                <th scope="col" className="font-medium py-2.5 w-24 text-right">You said</th>
                <th scope="col" className="font-medium py-2.5 w-32 text-right">Interviews show</th>
                <th scope="col" className="font-medium py-2.5 w-16 text-right">Gap</th>
              </tr>
            </thead>
            <tbody>
              {stats.skills.map((s) => {
                const claim = s.self_rating * 20
                const gap = s.proven_score === null ? null : s.proven_score - claim
                return (
                  <tr key={s.skill} className="border-t border-line">
                    <td className="py-2.5 text-ink">{s.skill}</td>
                    <td className="py-2.5 text-right tabular-nums text-soft">{claim}</td>
                    <td className="py-2.5 text-right tabular-nums text-soft">{s.proven_score === null ? <span className="text-subtle">Not tested</span> : hideScores ? 'Tested' : s.proven_score}</td>
                    <td className={`py-2.5 text-right tabular-nums ${gap === null || hideScores ? 'text-subtle' : gap <= -20 ? 'text-bad' : gap >= 0 ? 'text-good' : 'text-soft'}`}>
                      {gap === null || hideScores ? '-' : gap > 0 ? `+${gap}` : gap}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}

      <GuidesList />
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
