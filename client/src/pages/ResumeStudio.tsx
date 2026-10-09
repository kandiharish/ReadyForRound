import { useCallback, useEffect, useState } from 'react'
import { useMe } from '../auth/MeProvider'
import { apiFetch } from '../lib/api'
import { groupRoles } from '../lib/sessions'
import { ResumeCard, type Resume } from '../components/ResumeCard'
import { Select } from '../components/Select'
import { useFeedback } from '../components/Feedback'
import { Button, Card, Icon, PageHeader, ScoreRing } from '../components/ui'
import { ListSkeleton } from '../components/Skeleton'

// Resume Studio: ATS-readiness, project fit for a role, and how to write a resume for that role.

type Status = 'pass' | 'warn' | 'fail'
type Check = { id: string; label: string; status: Status; detail: string; fix?: string }
type ProjectFit = {
  projects: { name: string; fit: 'strong' | 'partial' | 'weak'; why: string; gaps: string[]; rewrite: string }[]
  order: string[]
  advice: string
}
type Review = {
  fileName: string
  updatedAt: string
  ats: { score: number; checks: Check[]; keywords: { label: string; found: string[]; missing: string[]; percent: number } }
  guidelines: { order: string[]; show: string[]; formula: string; examples: { weak: string; strong: string }[]; avoid: string[] }
  projectFit: ProjectFit | null
}
type JobAd = { id: string; title: string; company: string }

const STATUS: Record<Status, { icon: 'check' | 'alert'; cls: string; ring: string; word: string }> = {
  pass: { icon: 'check', cls: 'bg-good-soft text-good', ring: 'border-line', word: 'Good' },
  warn: { icon: 'alert', cls: 'bg-warn-soft text-warn', ring: 'border-warn/30', word: 'Improve' },
  fail: { icon: 'alert', cls: 'bg-bad-soft text-bad', ring: 'border-bad/30', word: 'Fix' },
}
const FIT = {
  strong: { cls: 'bg-good-soft text-good', word: 'Strong fit' },
  partial: { cls: 'bg-warn-soft text-warn', word: 'Partial fit' },
  weak: { cls: 'bg-bad-soft text-bad', word: 'Weak fit' },
}

export default function ResumeStudio() {
  const { me, catalog, label } = useMe()
  const { toast } = useFeedback()
  const [resume, setResume] = useState<Resume | null | undefined>(undefined)
  const [target, setTarget] = useState<string>('') // "role:<id>" or "job:<id>"
  const [jobs, setJobs] = useState<JobAd[]>([])
  const [review, setReview] = useState<Review | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fit, setFit] = useState<ProjectFit | null>(null)
  const [fitting, setFitting] = useState(false)

  const goalRole = me?.active_goal?.target_role ?? 'sde'
  const roleId = target.startsWith('role:') ? target.slice(5) : goalRole
  const jobId = target.startsWith('job:') ? target.slice(4) : undefined

  useEffect(() => { if (!target && me) setTarget(`role:${goalRole}`) }, [me, goalRole, target])
  useEffect(() => { apiFetch<JobAd[]>('/jobs').then(setJobs).catch(() => {}) }, [])

  const load = useCallback(() => {
    if (!resume || !target) return
    setError(null)
    setReview(null)
    const q = new URLSearchParams({ role: roleId, ...(jobId ? { jobId } : {}) })
    apiFetch<Review>(`/resume/review?${q}`).then((r) => { setReview(r); setFit(r.projectFit) }).catch((e) => setError(e.message))
  }, [resume, target, roleId, jobId])
  useEffect(() => { load() }, [load])

  const onResume = useCallback((r: Resume | null) => setResume(r), [])

  async function checkFit() {
    setFitting(true)
    try {
      setFit(await apiFetch<ProjectFit>('/resume/fit', { method: 'POST', body: JSON.stringify({ role: roleId }) }))
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setFitting(false)
    }
  }

  if (!catalog || !me) return <ListSkeleton label="Loading Resume Studio" />
  const roleName = label('roles', roleId)
  const options = [
    ...groupRoles(catalog.roles).flatMap((g) => g.roles.map((r) => ({ value: `role:${r.id}`, label: r.label, hint: r.id === goalRole ? 'Your goal' : g.title.startsWith('Software') ? undefined : 'Core engineering' }))),
    ...jobs.map((j) => ({ value: `job:${j.id}`, label: `Job ad: ${j.title}`, hint: j.company || undefined })),
  ]

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Placements Hub" title="Resume Studio"
        subtitle="Check how your resume reads to hiring systems and recruiters, see which projects fit the role you want, and learn what a strong resume for that role looks like." />

      {/* The upload card stays on top: replace your resume any time and everything updates */}
      <ResumeCard onChange={onResume} />

      {resume === null && (
        <Card className="text-center py-10">
          <p className="font-semibold">Upload your resume to start</p>
          <p className="text-sm text-muted mt-1 max-w-md mx-auto">We read the text from your PDF (the file itself isn't kept) and check it against the role you choose.</p>
        </Card>
      )}

      {resume && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted">Check against</span>
            <Select label="Role or job ad to check against" value={target} onChange={(v) => { setTarget(v); setFit(null) }} options={options} className="w-full sm:w-96" />
          </div>

          {error && <p className="text-bad text-sm">{error}</p>}
          {!review && !error && <ListSkeleton rows={4} header={false} label="Checking your resume" />}

          {review && (
            <>
              {/* ATS-readiness */}
              <section className="rounded-2xl border border-line bg-linear-to-br from-sky via-card to-lavender p-6 flex flex-col sm:flex-row gap-6 items-center">
                <div className="bg-card/80 rounded-full p-1 shadow-sm"><ScoreRing value={review.ats.score} label="ATS-ready" suffix="" size={124} /></div>
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-ink">ATS-readiness</p>
                  <p className="text-lg font-semibold mt-1">
                    {review.ats.score >= 80 ? 'Ready to send.' : review.ats.score >= 60 ? 'Close. A few fixes will make it stronger.' : 'Needs work before you apply.'}
                  </p>
                  <p className="text-sm text-soft mt-1">
                    Checked for <b className="text-ink">{review.ats.keywords.label}</b>. Applicant tracking systems read your text and filter by keywords;
                    this score checks those things and the basics recruiters look for.
                  </p>
                  <p className="text-xs text-muted mt-2">An estimate: there's no single official ATS score, and each company's system differs.</p>
                </div>
              </section>

              <div className="grid gap-3 md:grid-cols-2">
                {[...review.ats.checks].sort((a, b) => ({ fail: 0, warn: 1, pass: 2 }[a.status] - { fail: 0, warn: 1, pass: 2 }[b.status])).map((c) => (
                  <div key={c.id} className={`rounded-2xl border bg-card p-4 flex gap-3 ${STATUS[c.status].ring}`}>
                    <span className={`w-8 h-8 shrink-0 rounded-full grid place-items-center ${STATUS[c.status].cls}`}><Icon name={STATUS[c.status].icon} size={16} strokeWidth={2.2} /></span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm flex items-center gap-2">{c.label}<span className={`text-[10px] font-bold uppercase tracking-wide rounded-full px-1.5 py-px ${STATUS[c.status].cls}`}>{STATUS[c.status].word}</span></p>
                      <p className="text-sm text-soft mt-0.5">{c.detail}</p>
                      {c.fix && <p className="text-sm text-ink mt-1.5"><span className="font-semibold">How: </span>{c.fix}</p>}
                    </div>
                  </div>
                ))}
              </div>

              <Card className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-semibold">Keywords for {review.ats.keywords.label}</h2>
                  <span className="text-sm font-mono text-muted">{review.ats.keywords.percent}% found</span>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {review.ats.keywords.found.map((k) => <li key={k} className="inline-flex items-center gap-1 rounded-full bg-good-soft text-good px-3 py-1 text-sm font-medium"><Icon name="check" size={13} strokeWidth={2.4} />{k}</li>)}
                  {review.ats.keywords.missing.map((k) => <li key={k} className="rounded-full border border-dashed border-line-strong px-3 py-1 text-sm text-muted">{k}</li>)}
                </ul>
                <p className="text-xs text-muted">Green: found in your resume. Dashed: asked for but missing. Only add skills you can talk about in an interview.</p>
              </Card>

              {/* Project fit */}
              <Card className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">Do your projects fit {roleName}?</h2>
                    <p className="text-sm text-muted mt-0.5">Each project rated for this role, with a rewritten line that re-words only what you actually did.</p>
                  </div>
                  {!fit && <Button onClick={checkFit} disabled={fitting}>{fitting ? <><span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> Reading your projects…</> : <><Icon name="bolt" size={16} /> Check my projects</>}</Button>}
                </div>
                {fit && (
                  <>
                    <ul className="grid gap-3 lg:grid-cols-2">
                      {fit.projects.map((p) => (
                        <li key={p.name} className="rounded-2xl border border-line p-4 space-y-2.5">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-semibold leading-snug">{p.name}</p>
                            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${FIT[p.fit].cls}`}>{FIT[p.fit].word}</span>
                          </div>
                          <p className="text-sm text-soft">{p.why}</p>
                          {p.gaps.length > 0 && <p className="text-xs text-muted"><span className="font-semibold text-soft">The role would also want: </span>{p.gaps.join('; ')}</p>}
                          <div className="rounded-xl bg-accent-soft p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-deep">Stronger line for this role</p>
                            <p className="text-sm text-ink mt-1">{p.rewrite}</p>
                            <button type="button" onClick={() => navigator.clipboard.writeText(p.rewrite).then(() => toast('Copied', 'success')).catch(() => {})}
                              className="mt-2 text-xs font-semibold text-accent-deep hover:underline">Copy</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    {fit.order.length > 1 && <p className="text-sm"><span className="font-semibold">Best order for this role: </span><span className="text-soft">{fit.order.join(' → ')}</span></p>}
                    {fit.advice && <p className="text-sm text-soft"><span className="font-semibold text-ink">Next: </span>{fit.advice}</p>}
                    <p className="text-xs text-muted">Written by AI from your resume. Placeholders like [add number] mark where a real figure would help. Never add numbers you can't back up.</p>
                  </>
                )}
              </Card>

              {/* Guidelines */}
              <section className="grid gap-4 lg:grid-cols-2">
                <Card className="space-y-4">
                  <h2 className="font-semibold">A strong resume for {roleName}</h2>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Section order</p>
                    <ol className="space-y-1.5">
                      {review.guidelines.order.map((o, i) => (
                        <li key={o} className="flex gap-2.5 text-sm"><span className="w-5 h-5 shrink-0 rounded-full bg-accent-soft text-accent-deep text-[11px] font-bold grid place-items-center">{i + 1}</span><span className="text-soft">{o}</span></li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">What to show</p>
                    <ul className="space-y-1.5">{review.guidelines.show.map((s) => <li key={s} className="flex gap-2 text-sm text-soft"><span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />{s}</li>)}</ul>
                  </div>
                </Card>
                <Card className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">The bullet formula</p>
                    <p className="text-sm font-semibold">{review.guidelines.formula}</p>
                  </div>
                  <ul className="space-y-3">
                    {review.guidelines.examples.map((e) => (
                      <li key={e.weak} className="space-y-1.5">
                        <p className="text-sm rounded-lg bg-bad-soft/60 px-3 py-2"><span className="font-semibold text-bad">Weak: </span><span className="text-soft line-through decoration-bad/40">{e.weak}</span></p>
                        <p className="text-sm rounded-lg bg-good-soft px-3 py-2"><span className="font-semibold text-good">Strong: </span><span className="text-ink">{e.strong}</span></p>
                      </li>
                    ))}
                  </ul>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Leave out</p>
                    <ul className="space-y-1.5">{review.guidelines.avoid.map((s) => <li key={s} className="flex gap-2 text-sm text-soft"><Icon name="alert" size={14} className="text-warn mt-0.5 shrink-0" />{s}</li>)}</ul>
                  </div>
                </Card>
              </section>
            </>
          )}
        </>
      )}
    </div>
  )
}
