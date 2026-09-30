import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { apiFetch } from '../lib/api'
import { useMe } from '../auth/MeProvider'
import { Button, ButtonLink, EmptyState, Icon, PageHeader, Spinner } from '../components/ui'
import type { Interview, RoundId } from '../types'

type Choice = { mode: 'complete' } | { mode: 'single'; round: RoundId }

// Choose an interview: a complete one (rounds depend on the goal's company type) or a single round.
export default function Practice() {
  const navigate = useNavigate()
  const { me, catalog, label } = useMe()
  const [choice, setChoice] = useState<Choice>({ mode: 'complete' })
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    ? 'border-lime bg-lime-deep ring-1 ring-lime' : 'border-line bg-ink-800 hover:border-line-strong'}`

  async function start() {
    setStarting(true)
    setError(null)
    try {
      const iv = await apiFetch<Interview>('/interviews', { method: 'POST', body: JSON.stringify(choice) })
      navigate(`/interview/${iv.id}`)
    } catch (err) {
      setError((err as Error).message)
      setStarting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Practice" title="Start a mock interview"
        subtitle={`Questions are shaped for ${label('roles', goal.target_role)} at a ${label('companyTypes', goal.company_type).toLowerCase()}, at your level: ${label('experienceLevels', goal.experience_level).toLowerCase()}.`} />

      <button type="button" onClick={() => setChoice({ mode: 'complete' })} aria-pressed={isSelected({ mode: 'complete' })} className={`${cardClass({ mode: 'complete' })} w-full`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-display text-3xl">Complete interview</span>
          <span className="text-xs font-semibold bg-lime text-ink-900 rounded-full px-2.5 py-1">Like a real drive</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3 text-sm">
          {sequence.map((id, i) => (
            <span key={id} className="flex items-center gap-2">
              {i > 0 && <Icon name="arrow" size={14} className="text-subtle" />}
              <span className="rounded-full border border-line-strong bg-ink-750 px-3 py-1">{roundLabel(id)}</span>
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

      {error && <p className="text-sm text-rose">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <p className="text-sm text-muted">Preparing for something else? <Link to="/goals" className="text-lime">Change your goal</Link></p>
        <Button onClick={start} disabled={starting} className="px-6">
          <Icon name="play" size={16} /> {starting ? 'Preparing your interviewer…' : 'Start interview'}
        </Button>
      </div>
    </div>
  )
}
