import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { apiFetch } from '../lib/api'
import { startDrill } from '../lib/sessions'
import { useMe } from '../auth/MeProvider'
import { Button, ButtonLink, EmptyState, Icon, PageHeader, Spinner } from '../components/ui'
import type { Interview, RoundId } from '../types'

type Choice = { mode: 'complete' } | { mode: 'single'; round: RoundId }

// Choose an interview: a complete one (rounds depend on the goal's company type) or a single round.
export default function Practice() {
  const navigate = useNavigate()
  const { me, catalog, label, usage, refreshUsage } = useMe()
  const [choice, setChoice] = useState<Choice>({ mode: 'complete' })
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [topic, setTopic] = useState('')

  if (!me || !catalog) return <Spinner />
  const goal = me.active_goal
  if (!goal) {
    return <EmptyState title="First, choose a goal" body="Tell us what you're preparing for, so the interviewer can ask the right questions."
      action={<ButtonLink to="/goals">Create a goal</ButtonLink>} />
  }

  const roundLabel = (id: RoundId) => catalog.rounds.find((r) => r.id === id)?.label ?? id
  const sequence = catalog.completeSequences[goal.company_type] ?? catalog.completeSequences.any
  const isSelected = (c: Choice) => c.mode === choice.mode && (c.mode === 'complete' || (choice.mode === 'single' && c.round === choice.round))
  const cardClass = (c: Choice) => `text-left rounded-2xl border p-5 transition-colors ${isSelected(c)
    ? 'border-accent bg-accent-soft ring-1 ring-accent' : 'border-line bg-card hover:border-line-strong'}`

  async function start() {
    setStarting(true)
    setError(null)
    try {
      const iv = await apiFetch<Interview>('/interviews', { method: 'POST', body: JSON.stringify(choice) })
      refreshUsage()
      navigate(`/interview/${iv.id}`)
    } catch (err) {
      setError((err as Error).message)
      setStarting(false)
    }
  }

  async function drill() {
    const t = topic.trim()
    if (t.length < 2) return setError('Type a topic for your drill, e.g. "SQL joins"')
    setStarting(true)
    setError(null)
    try {
      const iv = await startDrill(t)
      refreshUsage()
      navigate(`/interview/${iv.id}`)
    } catch (err) {
      setError((err as Error).message)
      setStarting(false)
    }
  }

  const interviewsLeft = usage ? usage.interviews.limit - usage.interviews.used : 1
  const drillsLeft = usage ? usage.drills.limit - usage.drills.used : 1

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Practice" title="Start a mock interview"
        subtitle={`Questions are shaped for ${label('roles', goal.target_role)} at a ${label('companyTypes', goal.company_type).toLowerCase()}, at your level: ${label('experienceLevels', goal.experience_level).toLowerCase()}.`} />

      <button type="button" onClick={() => setChoice({ mode: 'complete' })} aria-pressed={isSelected({ mode: 'complete' })} className={`${cardClass({ mode: 'complete' })} w-full`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-display font-semibold text-3xl">Complete interview</span>
          <span className="text-xs font-semibold bg-accent text-on-accent rounded-full px-2.5 py-1">Like a real drive</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3 text-sm">
          {sequence.map((id, i) => (
            <span key={id} className="flex items-center gap-2">
              {i > 0 && <Icon name="arrow" size={14} className="text-subtle" />}
              <span className="rounded-full border border-line-strong bg-raised px-3 py-1">{roundLabel(id)}</span>
            </span>
          ))}
        </div>
      </button>

      <div>
        <h2 className="text-sm font-medium text-muted mb-3">Or practise one round</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {catalog.rounds.map((r) => (
            <button key={r.id} type="button" onClick={() => setChoice({ mode: 'single', round: r.id })}
              aria-pressed={isSelected({ mode: 'single', round: r.id })} className={cardClass({ mode: 'single', round: r.id })}>
              <span className="font-semibold">{r.label}</span>
              <span className="block text-sm text-muted mt-1">{r.description}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-bad" role="alert">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <p className="text-sm text-muted">
          {usage && <><b className="text-ink font-mono">{Math.max(0, interviewsLeft)}</b> of {usage.interviews.limit} interviews left today · </>}
          Preparing for something else? <Link to="/goals" className="text-accent-deep">Change your goal</Link>
        </p>
        <Button onClick={start} disabled={starting || interviewsLeft <= 0} className="px-6">
          <Icon name="play" size={16} /> {starting ? 'Preparing your interviewer…' : interviewsLeft <= 0 ? 'Daily limit reached' : 'Start interview'}
        </Button>
      </div>

      <section className="rounded-2xl border border-line bg-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold flex items-center gap-2"><Icon name="bolt" size={16} className="text-accent-deep" /> 5-minute drill</h2>
          {usage && <span className="text-xs text-muted">{Math.max(0, drillsLeft)} of {usage.drills.limit} drills left today</span>}
        </div>
        <p className="text-sm text-muted">Three quick questions on one topic. Great for a daily habit, or right before an interview.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <label htmlFor="drill-topic" className="sr-only">Drill topic</label>
          <input id="drill-topic" value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={80} placeholder="Topic, e.g. SQL joins or React hooks"
            onKeyDown={(e) => { if (e.key === 'Enter') drill() }}
            className="flex-1 min-h-11 rounded-xl bg-raised border border-line-strong px-3 text-sm" />
          <Button variant="secondary" onClick={drill} disabled={starting || drillsLeft <= 0}>Start drill</Button>
        </div>
      </section>
    </div>
  )
}
