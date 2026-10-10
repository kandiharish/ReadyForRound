import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useMe } from '../auth/MeProvider'
import { apiFetch } from '../lib/api'
import { startDrill } from '../lib/sessions'
import { useFeedback } from '../components/Feedback'
import { Button, Card, EmptyState, Icon, PageHeader, ScoreRing } from '../components/ui'
import { ListSkeleton } from '../components/Skeleton'
import { LearnMissing } from './Market'
import type { Interview, RoundId, UserSkill } from '../types'

// Job Readiness (job match): paste a real job ad, see which of its skills you have, and practise an interview aimed at it.

type JobSkill = { skill: string; must: boolean }
type JobListItem = { id: string; title: string; company: string; skills: JobSkill[]; created_at: string }
type Job = JobListItem & {
  summary: { experience: string; mustHave: string[]; niceToHave: string[]; responsibilities: string[]; interviewFocus: string[] }
}

type Status = 'proven' | 'claimed' | 'missing'
function skillStatus(mySkills: UserSkill[]) {
  const mine = new Map(mySkills.map((s) => [s.skill.toLowerCase(), s]))
  return (skill: string): Status => {
    const s = mine.get(skill.toLowerCase())
    if (!s) return 'missing'
    return s.proven_score !== null && s.proven_score >= 60 ? 'proven' : 'claimed'
  }
}
// Share of the required skills that are on the profile
function matchScore(skills: JobSkill[], status: (s: string) => Status) {
  const must = skills.filter((s) => s.must)
  const list = must.length ? must : skills
  if (!list.length) return null
  return Math.round((list.filter((s) => status(s.skill) !== 'missing').length / list.length) * 100)
}

export default function Jobs() {
  const { me } = useMe()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<JobListItem[] | null>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { apiFetch<JobListItem[]>('/jobs').then(setJobs).catch((e) => setError(e.message)) }, [])

  async function read(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const job = await apiFetch<Job>('/jobs', { method: 'POST', body: JSON.stringify({ text }) })
      navigate(`/jobs/${job.id}`)
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  const status = skillStatus(me?.user_skills ?? [])

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Placements Hub" title="Job Readiness"
        subtitle="Found a job you want? Paste its description. See which skills you already have, what's missing, and practise an interview aimed at that exact job." />

      <form onSubmit={read} className="rounded-2xl border border-line bg-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-card text-sky-ink grid place-items-center shadow-sm"><Icon name="file" size={20} /></span>
          <div>
            <h2 className="font-semibold">Paste a job description</h2>
            <p className="text-sm text-muted">Copy the full text from LinkedIn, Naukri, Indeed or the company's careers page.</p>
          </div>
        </div>
        <label htmlFor="jd" className="sr-only">Job description</label>
        <textarea id="jd" value={text} onChange={(e) => setText(e.target.value)} rows={8} maxLength={20_000} disabled={busy}
          placeholder={'Junior Frontend Developer\n\nWhat you\'ll do:\n- Build UI components in React…\n\nRequirements:\n- 0–2 years of experience…'}
          className="w-full rounded-xl border border-line-strong bg-card p-4 text-sm leading-relaxed focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60" />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy || text.trim().length < 200}>
            {busy ? <><span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> Reading the job ad…</> : <><Icon name="bolt" size={16} /> Match me to this job</>}
          </Button>
          <span className="text-xs text-muted">{text.trim().length < 200 ? 'Paste at least a few lines of the description' : `${text.length.toLocaleString()} characters`}</span>
        </div>
        {error && <p className="text-sm text-bad">{error}</p>}
        <p className="text-xs text-muted">Only the job ad text is saved, so you can come back to it. We keep your last 10.</p>
      </form>

      <section className="space-y-3">
        <h2 className="font-display font-semibold text-2xl">Your job ads</h2>
        {!jobs ? <ListSkeleton rows={3} header={false} label="Loading your job ads" /> : jobs.length === 0 ? (
          <p className="text-sm text-muted">None yet. Paste one above to get started.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {jobs.map((j) => {
              const score = matchScore(j.skills, status)
              return (
                <li key={j.id}>
                  <Link to={`/jobs/${j.id}`} className="h-full rounded-2xl bg-card border border-line p-4 flex items-center gap-4 hover:border-accent/40 transition-all">
                    <span className={`w-14 h-14 shrink-0 rounded-2xl grid place-items-center font-bold text-lg tabular-nums ${score === null ? 'bg-raised text-muted' : score >= 70 ? 'bg-good-soft text-good' : score >= 40 ? 'bg-warn-soft text-warn' : 'bg-blush text-blush-ink'}`}>
                      {score === null ? '-' : `${score}%`}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold truncate">{j.title}</span>
                      <span className="block text-sm text-muted truncate">{j.company || 'Company not stated'} · {new Date(j.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

const PRACTICE: { round: RoundId | 'complete'; label: string; hint: string; icon: 'bolt' | 'trophy' | 'profile' | 'book' }[] = [
  { round: 'technical', label: 'Technical round', hint: 'Questions on the skills this job needs', icon: 'bolt' },
  { round: 'complete', label: 'Complete interview', hint: 'Every round, aimed at this job', icon: 'trophy' },
  { round: 'project', label: 'Project deep-dive', hint: 'Show how your projects fit the job', icon: 'book' },
  { round: 'hr', label: 'HR round', hint: 'Why this job, fit and expectations', icon: 'profile' },
]

export function JobPage() {
  const { id } = useParams()
  const { me, refreshUsage } = useMe()
  const { confirm } = useFeedback()
  const navigate = useNavigate()
  const [job, setJob] = useState<Job | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState<string | null>(null)

  useEffect(() => { apiFetch<Job>(`/jobs/${id}`).then(setJob).catch((e) => setError(e.message)) }, [id])

  if (error && !job) return <EmptyState title="Job ad not found" body={error} action={<Link to="/jobs" className="text-accent-deep font-semibold">Job Readiness</Link>} />
  if (!job || !me) return <ListSkeleton label="Loading the job ad" />

  const status = skillStatus(me.user_skills)
  const score = matchScore(job.skills, status)
  const must = job.skills.filter((s) => s.must)
  const nice = job.skills.filter((s) => !s.must)
  const missingMust = must.filter((s) => status(s.skill) === 'missing')

  async function start(round: RoundId | 'complete') {
    setStarting(round)
    setError(null)
    try {
      const body = round === 'complete' ? { mode: 'complete', jobId: job!.id } : { mode: 'single', round, jobId: job!.id }
      const iv = await apiFetch<Interview>('/interviews', { method: 'POST', body: JSON.stringify(body) })
      refreshUsage()
      navigate(`/interview/${iv.id}`)
    } catch (err) {
      setError((err as Error).message)
      setStarting(null)
    }
  }
  async function drill(skill: string) {
    setStarting(skill)
    try {
      const iv = await startDrill(skill)
      refreshUsage()
      navigate(`/interview/${iv.id}`)
    } catch (err) {
      setError((err as Error).message)
      setStarting(null)
    }
  }
  async function remove() {
    if (!(await confirm({ title: 'Remove this job ad?', body: 'Interviews you already did for it stay in your reports.', confirmLabel: 'Remove', danger: true }))) return
    await apiFetch(`/jobs/${job!.id}`, { method: 'DELETE' }).catch(() => {})
    navigate('/jobs')
  }

  return (
    <div className="space-y-6">
      <Link to="/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><Icon name="arrow" size={15} className="rotate-180" /> Job Readiness</Link>

      <section className="rounded-2xl border border-line bg-card p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
        <div className="bg-card/80 rounded-full p-1 shadow-sm"><ScoreRing value={score} label="match" size={120} /></div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold tracking-[0.16em] text-lavender-ink">Job Readiness</p>
          <h1 className="font-display font-semibold text-3xl sm:text-4xl leading-tight mt-1">{job.title}</h1>
          <p className="text-soft mt-1">{[job.company, job.summary.experience].filter(Boolean).join(' · ') || 'Company not stated'}</p>
          <p className="text-sm text-soft mt-3 max-w-2xl">
            {score === null ? 'We couldn\'t find skills from our list in this ad.'
              : missingMust.length === 0 ? 'You list every required skill. Now prove them in an interview aimed at this job.'
                : `You have ${must.length - missingMust.length} of the ${must.length} required skills. Missing: ${missingMust.slice(0, 4).map((s) => s.skill).join(', ')}${missingMust.length > 4 ? '…' : ''}.`}
          </p>
        </div>
      </section>

      <Card className="space-y-4">
        <div>
          <h2 className="font-semibold">Practise for this job</h2>
          <p className="text-sm text-muted mt-1">The interviewer reads this job ad and aims the questions at what it asks for.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PRACTICE.map((p, i) => (
            <button key={p.round} type="button" onClick={() => start(p.round)} disabled={!!starting}
              className={`text-left rounded-xl border p-4 flex flex-col gap-1.5 transition-all disabled:opacity-60 ${i === 0 ? 'border-accent bg-accent-soft' : 'border-line bg-card hover:border-accent/40'}`}>
              <Icon name={p.icon} size={18} className="text-accent" />
              <span className="font-semibold">{starting === p.round ? 'Starting…' : p.label}</span>
              <span className="text-xs text-muted">{p.hint}</span>
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-bad">{error}</p>}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="font-semibold">Skills in this ad</h2>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-good" /> Proven</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-warn" /> On your profile</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-line-strong" /> Missing</span>
            </div>
          </div>
          {[['Required', must], ['Nice to have', nice]].map(([title, list]) => (list as JobSkill[]).length > 0 && (
            <div key={title as string}>
              <p className="text-xs font-semibold text-muted mb-2">{title as string}</p>
              <ul className="flex flex-wrap gap-2">
                {(list as JobSkill[]).map((s) => {
                  const st = status(s.skill)
                  return (
                    <li key={s.skill}>
                      {st === 'missing' ? (
                        <button type="button" onClick={() => drill(s.skill)} disabled={!!starting} title={`Start a 5-minute drill on ${s.skill}`}
                          className="group inline-flex items-center gap-1.5 rounded-full border border-dashed border-line-strong px-3 py-1.5 text-sm text-soft hover:border-accent hover:text-accent-deep disabled:opacity-60">
                          {s.skill} <span className="text-[11px] font-semibold text-accent-deep opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100">{starting === s.skill ? 'Starting…' : 'drill'}</span>
                        </button>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${st === 'proven' ? 'bg-good-soft text-good' : 'bg-warn-soft text-warn'}`}>
                          {st === 'proven' && <Icon name="check" size={14} strokeWidth={2.4} />}{s.skill}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
          {job.skills.length === 0 && <p className="text-sm text-muted">No skills from our list were found in this ad.</p>}
          <LearnMissing skills={missingMust.map((s) => s.skill)} />
          <p className="text-xs text-muted">Tap a missing skill for a 5-minute drill. Have it already? <Link to="/profile" className="text-accent-deep font-semibold">Add it to your profile</Link>.</p>
        </Card>

        <Card className="space-y-5">
          {job.summary.interviewFocus.length > 0 && (
            <div>
              <h2 className="font-semibold flex items-center gap-2"><Icon name="target" size={16} className="text-accent" /> What they'll likely test</h2>
              <ul className="mt-3 space-y-2">
                {job.summary.interviewFocus.map((f) => <li key={f} className="flex gap-2 text-sm text-soft"><span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />{f}</li>)}
              </ul>
            </div>
          )}
          {job.summary.responsibilities.length > 0 && (
            <div>
              <h2 className="font-semibold flex items-center gap-2"><Icon name="book" size={16} className="text-accent" /> What the job involves</h2>
              <ul className="mt-3 space-y-2">
                {job.summary.responsibilities.map((r) => <li key={r} className="flex gap-2 text-sm text-soft"><span className="w-1.5 h-1.5 rounded-full bg-sage-ink mt-2 shrink-0" />{r}</li>)}
              </ul>
            </div>
          )}
          <p className="text-xs text-muted">Read by AI from the ad you pasted. Check the original ad for anything important.</p>
        </Card>
      </div>

      <button type="button" onClick={remove} className="text-sm text-muted hover:text-bad">Remove this job ad</button>
    </div>
  )
}
