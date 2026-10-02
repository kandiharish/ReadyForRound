import { useEffect, useState, type FormEvent } from 'react'
import { apiFetch } from '../lib/api'
import { useMe } from '../auth/MeProvider'
import { Bar, Button, Card, ChoiceCards, Icon, PageHeader, ScoreRing, Spinner } from '../components/ui'
import type { GoalWithStats } from '../types'

const STATUS = {
  active: { text: 'In progress', cls: 'bg-accent text-on-accent' },
  achieved: { text: 'Achieved', cls: 'bg-info-soft text-info' },
  archived: { text: 'Paused', cls: 'bg-hover text-soft' },
} as const

// Your goals over time: what you're preparing for now, and everything you've prepared for before.
export default function Goals() {
  const { me, catalog, label, refresh } = useMe()
  const [goals, setGoals] = useState<GoalWithStats[] | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = () => apiFetch<GoalWithStats[]>('/goals').then(setGoals).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])

  if (error) return <p className="text-bad">{error}</p>
  if (!goals || !catalog || !me) return <Spinner />

  async function setStatus(id: string, status: 'active' | 'achieved' | 'archived') {
    await apiFetch(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }).catch((e) => setError(e.message))
    await Promise.all([load(), refresh()])
  }

  const active = goals.find((g) => g.status === 'active')
  const hideScores = me.practice_without_score

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Goals" title="Your career, one goal at a time"
        subtitle="Every interview, report and score belongs to a goal. When you move on, from placement to your first job to your next switch, start a new goal and your history stays here."
        actions={!creating && <Button onClick={() => setCreating(true)}><Icon name="plus" size={16} strokeWidth={2.4} /> New goal</Button>} />

      {creating && (
        <NewGoalForm defaultLevel={me.experience_level} onCancel={() => setCreating(false)}
          onCreated={async () => { setCreating(false); await Promise.all([load(), refresh()]) }} />
      )}

      <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
        <Card>
          <h2 className="font-semibold mb-5">Career timeline</h2>
          <ol className="space-y-0">
            {goals.map((g, i) => (
              <li key={g.id} className="flex gap-4">
                <div className="flex flex-col items-center w-5 pt-5">
                  <span className={`w-4.5 h-4.5 rounded-full shrink-0 ${g.status === 'active' ? 'border-4 border-accent bg-card' : g.status === 'achieved' ? 'bg-info' : 'bg-line-strong'}`} />
                  {i < goals.length - 1 && <span className="w-0.5 flex-1 bg-hover mt-1.5" />}
                </div>
                <div className={`flex-1 rounded-2xl border p-4 mb-4 ${g.status === 'active' ? 'bg-accent-soft border-accent/40' : 'bg-raised/60 border-line'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs text-muted">
                      {new Date(g.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                      {g.target_date ? ` → target ${new Date(g.target_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                    </span>
                    <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${STATUS[g.status].cls}`}>{STATUS[g.status].text}</span>
                  </div>
                  <h3 className="text-lg font-semibold mt-2">{label('roles', g.target_role)} · {label('companyTypes', g.company_type)}</h3>
                  <p className="text-sm text-muted mt-0.5">
                    {label('experienceLevels', g.experience_level)} · {g.interviews} interview{g.interviews === 1 ? '' : 's'}
                    {!hideScores && g.startedAt !== null && g.readiness !== null && g.interviews > 3 ? ` · ${g.startedAt}% → ${g.readiness}%` : ''}
                  </p>
                  {!hideScores && g.readiness !== null && (
                    <div className="flex items-center gap-3 mt-3"><div className="flex-1"><Bar value={g.readiness} tone={g.status === 'active' ? 'accent' : 'info'} /></div><span className="font-mono text-xs text-soft">{g.readiness}%</span></div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {g.status !== 'active' && <Button variant="secondary" className="min-h-9 text-xs" onClick={() => setStatus(g.id, 'active')}>Make this my current goal</Button>}
                    {g.status === 'active' && <Button variant="secondary" className="min-h-9 text-xs" onClick={() => setStatus(g.id, 'achieved')}><Icon name="trophy" size={14} /> I achieved this</Button>}
                    {g.status === 'active' && <Button variant="ghost" className="min-h-9 text-xs" onClick={() => setStatus(g.id, 'archived')}>Pause</Button>}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <div className="space-y-6">
          {active ? (
            <Card className="space-y-5">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="text-xs font-semibold bg-accent text-on-accent rounded-full px-2.5 py-1">Current goal</span>
                  <h2 className="font-display font-semibold text-3xl leading-tight mt-3">{label('roles', active.target_role)}</h2>
                  <p className="text-sm text-muted">{label('companyTypes', active.company_type)}</p>
                </div>
                {!hideScores && active.readiness !== null && <ScoreRing value={active.readiness} size={84} label="" color="info" />}
              </div>
              <dl className="grid grid-cols-2 gap-3">
                {[
                  ['Level', label('experienceLevels', active.experience_level)],
                  ['Target date', active.target_date ? new Date(active.target_date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : 'Not set'],
                  ['Interviews', String(active.interviews)],
                  ['Study time', `${active.weekly_hours} hours a week`],
                  ['Rounds in a full interview', catalog.completeSequences[active.company_type].map((r) => catalog.rounds.find((x) => x.id === r)?.label).join(' → ')],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-raised px-4 py-3">
                    <dt className="text-xs text-muted">{k}</dt>
                    <dd className="text-sm font-semibold mt-0.5">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          ) : (
            <Card>
              <p className="font-display font-semibold text-2xl">No current goal</p>
              <p className="text-sm text-muted mt-1">Create a goal or pick an earlier one to keep practising.</p>
            </Card>
          )}
          <Card className="grid grid-cols-3 gap-4 text-center">
            {[
              [String(goals.reduce((n, g) => n + g.interviews, 0)), 'interviews in total'],
              [String(goals.length), goals.length === 1 ? 'goal' : 'goals'],
              [String(goals.filter((g) => g.status === 'achieved').length), 'achieved'],
            ].map(([v, k]) => (
              <div key={k}>
                <p className="font-mono text-2xl font-semibold">{v}</p>
                <p className="text-xs text-muted mt-1">{k}</p>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}

function NewGoalForm({ defaultLevel, onCancel, onCreated }: { defaultLevel: string | null; onCancel: () => void; onCreated: () => void }) {
  const { catalog } = useMe()
  const [role, setRole] = useState<string | null>(null)
  const [company, setCompany] = useState<string | null>(null)
  const [level, setLevel] = useState(defaultLevel ?? 'final_year')
  const [date, setDate] = useState('')
  const [hours, setHours] = useState(5)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!role || !company) return setError('Choose a role and a company type')
    setBusy(true)
    try {
      await apiFetch('/goals', { method: 'POST', body: JSON.stringify({ target_role: role, company_type: company, experience_level: level, target_date: date || null, weekly_hours: hours }) })
      onCreated()
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <Card className="border-accent/40">
      <form onSubmit={submit} className="space-y-6">
        <div>
          <h2 className="font-display font-semibold text-3xl">A new goal</h2>
          <p className="text-sm text-muted mt-1">Your current goal will be paused. You can switch back any time.</p>
        </div>
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-soft mb-3">Which role?</legend>
          <ChoiceCards columns={2} options={catalog!.roles} value={role} onChange={setRole} />
        </fieldset>
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-soft mb-3">What kind of company?</legend>
          <ChoiceCards columns={2} options={catalog!.companyTypes} value={company} onChange={setCompany} />
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-soft">
            Your experience now
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="min-h-11 rounded-xl bg-raised border border-line-strong px-3 text-ink font-normal">
              {catalog!.experienceLevels.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-soft">
            Target date (optional)
            <input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)}
              className="min-h-11 rounded-xl bg-raised border border-line-strong px-3 text-ink font-normal" />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-soft">
            Hours per week you can give
            <input type="number" min={1} max={40} value={hours} onChange={(e) => setHours(Math.max(1, Math.min(40, Number(e.target.value) || 1)))}
              className="min-h-11 rounded-xl bg-raised border border-line-strong px-3 text-ink font-normal" />
          </label>
        </div>
        {error && <p className="text-sm text-bad">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Start this goal'}</Button>
        </div>
      </form>
    </Card>
  )
}
