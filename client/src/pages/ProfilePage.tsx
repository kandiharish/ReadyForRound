import { useState, type FormEvent } from 'react'
import { useMe } from '../auth/MeProvider'
import { saveProfile } from '../lib/profile'
import { Button, Card, PageHeader, Spinner } from '../components/ui'

const RATING_LABELS = ['', 'Just started', 'Basic', 'Comfortable', 'Good', 'Expert']

// Who you are: name, experience and skills. (What you're preparing for lives on the Goals page.)
export default function ProfilePage() {
  const { me, catalog, refresh, label } = useMe()
  const [name, setName] = useState(me?.full_name ?? '')
  const [level, setLevel] = useState(me?.experience_level ?? 'final_year')
  const [skills, setSkills] = useState<Record<string, number>>(Object.fromEntries((me?.user_skills ?? []).map((s) => [s.skill, s.self_rating])))
  const [newSkill, setNewSkill] = useState('')
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  if (!me || !catalog) return <Spinner />

  const roleSkills = catalog.roles.find((r) => r.id === me.active_goal?.target_role)?.skills ?? []
  const allSkills = [...new Set([...roleSkills, ...Object.keys(skills)])]
  const proven = Object.fromEntries(me.user_skills.map((s) => [s.skill, s.proven_score]))

  function toggle(skill: string) {
    const next = { ...skills }
    if (next[skill]) delete next[skill]
    else next[skill] = 3
    setSkills(next)
  }

  function add() {
    const s = newSkill.trim()
    if (s && !skills[s]) setSkills({ ...skills, [s]: 3 })
    setNewSkill('')
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setStatus(null)
    try {
      await saveProfile(me!, { full_name: name, experience_level: level, skills: Object.entries(skills).map(([skill, self_rating]) => ({ skill, self_rating })) })
      await refresh()
      setStatus({ ok: true, text: 'Saved' })
    } catch (err) {
      setStatus({ ok: false, text: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <PageHeader eyebrow="Profile" title="About you"
        subtitle="Keep this up to date as your career grows. Your interviewer uses it to pitch questions at the right level." />

      <Card className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-soft">
          Full name
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80}
            className="min-h-11 rounded-xl bg-raised border border-line-strong px-3 text-ink font-normal" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-soft">
          Experience
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="min-h-11 rounded-xl bg-raised border border-line-strong px-3 text-ink font-normal">
            {catalog.experienceLevels.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </label>
      </Card>

      <Card className="space-y-5">
        <div>
          <h2 className="font-semibold">Skills</h2>
          <p className="text-sm text-muted mt-1">
            Tap the skills you know{me.active_goal ? ` (suggestions for ${label('roles', me.active_goal.target_role)})` : ''}, then rate yourself honestly. Interviews fill in what you can prove.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {allSkills.map((s) => (
            <button key={s} type="button" onClick={() => toggle(s)} aria-pressed={!!skills[s]}
              className={`px-3.5 py-1.5 rounded-full border text-sm ${skills[s] ? 'bg-accent border-accent text-on-accent font-medium' : 'border-line-strong text-soft hover:border-muted'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2 max-w-sm">
          <label className="sr-only" htmlFor="new-skill">Add another skill</label>
          <input id="new-skill" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Add another skill" maxLength={40}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
            className="flex-1 min-h-11 rounded-xl bg-raised border border-line-strong px-3 text-sm" />
          <Button type="button" variant="secondary" onClick={add}>Add</Button>
        </div>

        {Object.keys(skills).length > 0 && (
          <ul className="divide-y divide-line border-t border-line">
            {Object.entries(skills).map(([skill, rating]) => (
              <li key={skill} className="flex flex-wrap items-center gap-3 py-3">
                <span className="w-32 font-medium">{skill}</span>
                <div className="flex gap-1" role="group" aria-label={`How good are you at ${skill}?`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setSkills({ ...skills, [skill]: n })} aria-pressed={n === rating} title={RATING_LABELS[n]}
                      className={`w-9 h-9 rounded-lg text-sm font-mono ${n <= rating ? 'bg-accent text-on-accent' : 'bg-raised text-muted'}`}>{n}</button>
                  ))}
                </div>
                <span className="text-xs text-muted w-24">{RATING_LABELS[rating]}</span>
                <span className="ml-auto text-xs text-muted">
                  {proven[skill] == null ? 'Not tested yet' : me.practice_without_score ? 'Tested' : <>Proven <b className="font-mono text-ink">{proven[skill]}</b>/100</>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="flex items-center justify-end gap-4">
        {status && <span className={`text-sm ${status.ok ? 'text-accent-deep' : 'text-bad'}`} role="status">{status.text}</span>}
        <Button type="submit" disabled={busy || Object.keys(skills).length === 0}>{busy ? 'Saving…' : 'Save profile'}</Button>
      </div>
    </form>
  )
}
