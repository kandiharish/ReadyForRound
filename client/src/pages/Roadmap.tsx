import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { apiFetch } from '../lib/api'
import { startDrill } from '../lib/sessions'
import { useMe } from '../auth/MeProvider'
import { useFeedback } from '../components/Feedback'
import { Bar, Button, ButtonLink, Card, EmptyState, Icon, PageHeader } from '../components/ui'
import { ResourceLinks } from '../components/ResourceLinks'
import type { Goal, RoadmapTask } from '../types'
import { ListSkeleton } from '../components/Skeleton'

const KIND = {
  learn: { label: 'Learn', cls: 'bg-info-soft text-info' },
  practice: { label: 'Practice', cls: 'bg-accent-soft text-accent-deep' },
  build: { label: 'Build', cls: 'bg-warn-soft text-warn' },
  mock: { label: 'Mock interview', cls: 'bg-bad-soft text-bad' },
} as const

// Your week-by-week study plan for the current goal, built from your own feedback.
export default function Roadmap() {
  const navigate = useNavigate()
  const { me, label, refreshUsage } = useMe()
  const { toast } = useFeedback()
  const [data, setData] = useState<{ goal: Goal | null; tasks: RoadmapTask[] } | null>(null)
  const [building, setBuilding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openWeek, setOpenWeek] = useState<number | null>(null)

  useEffect(() => { apiFetch<typeof data>('/roadmap').then(setData).catch((e) => setError(e.message)) }, [])

  if (!data || !me) return error ? <p className="text-bad">{error}</p> : <ListSkeleton label="Loading your study plan" />
  if (!data.goal) return <EmptyState title="First, choose a goal" body="Your roadmap is planned around a goal and its target date." action={<ButtonLink to="/goals">Create a goal</ButtonLink>} />

  async function build() {
    setBuilding(true)
    setError(null)
    try {
      setData(await apiFetch('/roadmap/generate', { method: 'POST' }))
      toast('Your roadmap is ready')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBuilding(false)
    }
  }

  async function toggle(task: RoadmapTask) {
    setData((d) => d && { ...d, tasks: d.tasks.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)) }) // update the screen straight away
    await apiFetch(`/roadmap/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify({ done: !task.done }) }).catch((e) => setError(e.message))
  }

  async function drill(topic: string) {
    try {
      const iv = await startDrill(topic)
      refreshUsage()
      navigate(`/interview/${iv.id}`)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const { goal, tasks } = data
  const done = tasks.filter((t) => t.done).length
  const weeks = [...new Set(tasks.map((t) => t.week))].sort((a, b) => a - b)
  const currentWeek = weeks.find((w) => tasks.some((t) => t.week === w && !t.done)) ?? weeks[weeks.length - 1]
  const shownWeek = openWeek ?? currentWeek

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Roadmap" title="Your study plan"
        subtitle={`Built from your interview feedback for ${label('roles', goal.target_role)}, sized to about ${goal.weekly_hours} hours a week${goal.target_date ? ` until ${new Date(goal.target_date).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}` : ''}.`}
        actions={tasks.length > 0 && (
          <Button variant="secondary" onClick={build} disabled={building}>
            <Icon name="swap" size={16} /> {building ? 'Updating…' : 'Update from latest feedback'}
          </Button>
        )} />

      {error && <p className="text-sm text-bad">{error}</p>}

      {tasks.length === 0 ? (
        <Card className="text-center py-12">
          <p className="font-display font-semibold text-3xl">Let's plan your preparation</p>
          <p className="text-sm text-muted mt-2 max-w-lg mx-auto">
            We'll turn your reports and skills into weekly tasks: what to learn, what to practise, what to build, and when to test yourself.
            It's best after at least one interview, but you can start now.
          </p>
          <Button onClick={build} disabled={building} className="mt-6 px-6">{building ? 'Building your plan…' : 'Build my roadmap'}</Button>
        </Card>
      ) : (
        <>
          <Card className="flex flex-wrap items-center gap-6">
            <div className="flex-1 min-w-60 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-soft">Overall progress</span><span className="font-mono">{done} / {tasks.length} tasks</span></div>
              <Bar value={(done / tasks.length) * 100} tone="accent" />
            </div>
            <p className="text-sm text-muted">You're on <b className="text-ink">week {currentWeek}</b> of {weeks.length}</p>
          </Card>

          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Weeks">
            {weeks.map((w) => {
              const wt = tasks.filter((t) => t.week === w)
              const complete = wt.every((t) => t.done)
              return (
                <button key={w} role="tab" aria-selected={w === shownWeek} onClick={() => setOpenWeek(w)}
                  className={`min-h-10 px-4 rounded-full text-sm border inline-flex items-center gap-2 ${w === shownWeek ? 'bg-accent text-on-accent border-accent font-semibold' : 'bg-card border-line-strong text-soft hover:border-muted'}`}>
                  {complete && <Icon name="check" size={14} strokeWidth={2.6} />} Week {w}
                </button>
              )
            })}
          </div>

          <Card className="p-0 sm:p-0 overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-line flex justify-between text-sm">
              <span className="font-semibold">Week {shownWeek}</span>
              <span className="text-muted">about {Math.round(tasks.filter((t) => t.week === shownWeek).reduce((m, t) => m + t.minutes, 0) / 60 * 10) / 10} hours</span>
            </div>
            <ul>
              {tasks.filter((t) => t.week === shownWeek).map((t) => (
                <li key={t.id} className="flex gap-4 px-5 sm:px-6 py-4 border-t border-line first:border-t-0">
                  <input type="checkbox" checked={t.done} onChange={() => toggle(t)} aria-label={`Mark "${t.title}" as done`}
                    className="mt-1 w-5 h-5 shrink-0 accent-[var(--accent-deep)] cursor-pointer" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[11px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 ${KIND[t.kind].cls}`}>{KIND[t.kind].label}</span>
                      <span className="text-xs text-muted font-mono">{t.minutes} min</span>
                    </div>
                    <p className={`font-medium mt-1.5 ${t.done ? 'line-through text-subtle' : ''}`}>{t.title}</p>
                    {t.detail && <p className="text-sm text-soft mt-1">{t.detail}</p>}
                    {t.why && <p className="text-xs text-muted mt-1.5">Why: {t.why}</p>}
                    {t.topic && !t.done && t.kind !== 'mock' && <ResourceLinks topic={t.topic} context={t.title} className="mt-2.5" />}
                  </div>
                  {!t.done && (
                    t.kind === 'mock'
                      ? <ButtonLink to="/practice" variant="secondary" className="self-center min-h-9 text-xs shrink-0">Start mock</ButtonLink>
                      : t.topic && <Button variant="secondary" className="self-center min-h-9 text-xs shrink-0" onClick={() => drill(t.topic!)}>5-min drill</Button>
                  )}
                </li>
              ))}
            </ul>
          </Card>
          <p className="text-xs text-muted">This plan was written by AI from your feedback. The learning links are hand-picked free resources (official docs, free courses and practice sites), not written by AI.</p>
        </>
      )}
    </div>
  )
}
