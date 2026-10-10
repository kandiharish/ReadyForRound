import { useCallback, useState, type FormEvent } from 'react'
import { Select } from '../components/Select'
import { SkillPicker } from '../components/SkillPicker'
import { useMe } from '../auth/MeProvider'
import { useFeedback } from '../components/Feedback'
import { saveProfile } from '../lib/profile'
import { Button, Card, PageHeader, Spinner } from '../components/ui'
import { ResumeCard, type Resume } from '../components/ResumeCard'

// Who you are: name, experience and skills. (What you're preparing for lives on the Goals page.)
export default function ProfilePage() {
  const { me, catalog, refresh, label } = useMe()
  const { toast } = useFeedback()
  const [name, setName] = useState(me?.full_name ?? '')
  const [level, setLevel] = useState(me?.experience_level ?? 'final_year')
  const [skills, setSkills] = useState<Record<string, number>>(Object.fromEntries((me?.user_skills ?? []).map((s) => [s.skill, s.self_rating])))
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [resumeSkills, setResumeSkills] = useState<string[]>([])
  const onResume = useCallback((r: Resume | null) => setResumeSkills(r?.summary.skills ?? []), [])

  if (!me || !catalog) return <Spinner />

  const roleSkills = catalog.roles.find((r) => r.id === me.active_goal?.target_role)?.skills ?? []
  const proven = Object.fromEntries(me.user_skills.map((s) => [s.skill, s.proven_score]))

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setStatus(null)
    try {
      await saveProfile(me!, { full_name: name, experience_level: level, skills: Object.entries(skills).map(([skill, self_rating]) => ({ skill, self_rating })) })
      await refresh()
      setStatus(null)
      toast('Profile saved')
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
        <div className="flex flex-col gap-2 text-sm font-medium text-soft">
          Experience
          <Select label="Experience" value={level} onChange={setLevel}
            options={catalog.experienceLevels.map((l) => ({ value: l.id, label: l.label }))} />
        </div>
      </Card>

      <ResumeCard onChange={onResume} />

      <Card className="space-y-5">
        <div>
          <h2 className="font-semibold">Skills</h2>
          <p className="text-sm text-muted mt-1">
            Search and add the skills you know{me.active_goal ? ` (with suggestions for ${label('roles', me.active_goal.target_role)})` : ''}. You'll rate each one as you add it. Interviews fill in what you can prove.
          </p>
        </div>
        <SkillPicker skills={skills} onChange={setSkills} suggested={roleSkills} fromResume={resumeSkills}
          extra={(skill) => (
            <span className="text-xs text-muted">
              {proven[skill] == null ? 'Not tested yet' : me.practice_without_score ? 'Tested' : <>Proven <b className="tabular-nums text-ink">{proven[skill]}</b>/100</>}
            </span>
          )} />
      </Card>

      <div className="flex items-center justify-end gap-4">
        {status && <span className={`text-sm ${status.ok ? 'text-accent-deep' : 'text-bad'}`} role="status">{status.text}</span>}
        <Button type="submit" disabled={busy || Object.keys(skills).length === 0}>{busy ? 'Saving…' : 'Save profile'}</Button>
      </div>
    </form>
  )
}
