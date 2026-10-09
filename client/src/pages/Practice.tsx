import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { apiFetch } from '../lib/api'
import { startDrill } from '../lib/sessions'
import { useMe } from '../auth/MeProvider'
import { Button, ButtonLink, EmptyState, Icon, PageHeader, Spinner, type IconName } from '../components/ui'
import type { Interview, RoundId } from '../types'
import type { Resume } from '../components/ResumeCard'

type Choice = { mode: 'complete' } | { mode: 'single'; round: RoundId }

// Each round gets its own soft colour and icon, so they're easy to tell apart.
const ROUND_STYLE: Record<RoundId, { tint: string; icon: IconName }> = {
  technical: { tint: 'bg-sky text-sky-ink', icon: 'keyboard' },
  project: { tint: 'bg-peach text-peach-ink', icon: 'book' },
  behavioural: { tint: 'bg-sage text-sage-ink', icon: 'target' },
  hr: { tint: 'bg-blush text-blush-ink', icon: 'profile' },
  resume: { tint: 'bg-lavender text-lavender-ink', icon: 'file' },
}

// Choose an interview: a complete one (rounds depend on the goal's company type) or a single round.
export default function Practice() {
  const navigate = useNavigate()
  const { me, catalog, label, usage, refreshUsage } = useMe()
  const [choice, setChoice] = useState<Choice>({ mode: 'complete' })
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [topic, setTopic] = useState('')
  const [resume, setResume] = useState<Resume | null | undefined>(undefined)
  useEffect(() => { apiFetch<Resume | null>('/resume').then(setResume).catch(() => setResume(null)) }, [])

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

      {/* Company-style interviews */}
      <Link to="/companies" className="group flex items-center gap-3 rounded-2xl bg-linear-to-r from-lavender to-sky px-4 py-3 text-sm hover:shadow-md transition-shadow">
        <span className="w-9 h-9 rounded-xl bg-card text-accent flex items-center justify-center shrink-0"><Icon name="building" size={17} /></span>
        <span className="flex-1 min-w-0"><b className="text-ink">Preparing for a specific company?</b> <span className="text-soft">TCS, Infosys, Zoho, Amazon, Google and more, in their interview style.</span></span>
        <Icon name="arrow" size={16} className="text-accent group-hover:translate-x-0.5 transition-transform" />
      </Link>

      <p className="text-sm text-muted -mt-2">
        <Icon name="trend" size={14} className="inline -mt-0.5 mr-1 text-accent" />
        What do employers want for {label('roles', goal.target_role)}?{' '}
        <Link to={`/market/${goal.target_role}`} className="font-semibold text-accent-deep hover:underline">See openings, pay and skills →</Link>
      </p>

      {/* Resume status: with a resume, questions are about their own projects and experience */}
      {resume !== undefined && (resume ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-sage text-sage-ink px-4 py-3 text-sm">
          <Icon name="file" size={18} />
          <span className="flex-1 min-w-0"><b>Using your resume.</b> Expect questions about {resume.summary.projects.length ? `your projects like "${resume.summary.projects[0].name}"` : 'your experience and skills'}.</span>
          <Link to="/resume" className="font-semibold underline underline-offset-2">Check it in Resume Studio</Link>
        </div>
      ) : (
        <Link to="/profile" className="group flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-line-strong bg-card px-4 py-3 text-sm hover:border-accent">
          <span className="w-9 h-9 rounded-xl bg-peach text-peach-ink flex items-center justify-center shrink-0"><Icon name="file" size={17} /></span>
          <span className="flex-1 min-w-0 text-soft"><b className="text-ink">Add your resume</b> and the interviewer will ask about your own projects, like a real interview.</span>
          <span className="font-semibold text-accent inline-flex items-center gap-1">Upload <Icon name="arrow" size={15} className="group-hover:translate-x-0.5 transition-transform" /></span>
        </Link>
      ))}

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
          {catalog.rounds.map((r) => r.id === 'resume' && resume === null ? (
            // No resume yet: this round needs one, so the card leads to the Profile page instead
            <Link key={r.id} to="/profile" className="rounded-2xl border border-dashed border-line-strong bg-card p-5 text-left hover:border-accent">
              <span className="flex items-center gap-3">
                <span className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${ROUND_STYLE[r.id].tint}`}>
                  <Icon name={ROUND_STYLE[r.id].icon} size={17} />
                </span>
                <span className="font-semibold">{r.label}</span>
                <span className="ml-auto text-[11px] font-semibold rounded-full bg-peach text-peach-ink px-2 py-0.5">Needs your resume</span>
              </span>
              <span className="block text-sm text-muted mt-2">{r.description} <b className="text-accent-deep">Upload it on your Profile →</b></span>
            </Link>
          ) : (
            <button key={r.id} type="button" onClick={() => setChoice({ mode: 'single', round: r.id })}
              aria-pressed={isSelected({ mode: 'single', round: r.id })} className={cardClass({ mode: 'single', round: r.id })}>
              <span className="flex items-center gap-3">
                <span className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${ROUND_STYLE[r.id].tint}`}>
                  <Icon name={ROUND_STYLE[r.id].icon} size={17} />
                </span>
                <span className="font-semibold">{r.label}</span>
              </span>
              <span className="block text-sm text-muted mt-2">{r.description}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-bad" role="alert">{error}</p>}

      {/* On phones this row sticks just above the bottom tab bar, so "Start interview" is always in reach */}
      <div className="sticky bottom-[calc(4.6rem+env(safe-area-inset-bottom))] z-10 -mx-4 px-4 py-3 bg-paper/90 backdrop-blur border-t border-line flex flex-wrap items-center justify-between gap-3 sm:static sm:mx-0 sm:px-0 sm:py-0 sm:pt-5 sm:bg-transparent sm:backdrop-blur-none">
        <p className="text-sm text-muted">
          {usage && <><b className="text-ink font-mono">{Math.max(0, interviewsLeft)}</b> of {usage.interviews.limit} interviews left today · </>}
          Preparing for something else? <Link to="/goals" className="text-accent-deep">Change your goal</Link>
        </p>
        <Button onClick={start} disabled={starting || interviewsLeft <= 0} className="px-6 w-full sm:w-auto order-first sm:order-none">
          <Icon name="play" size={16} /> {starting ? 'Preparing your interviewer…' : interviewsLeft <= 0 ? 'Daily limit reached' : 'Start interview'}
        </Button>
      </div>

      {/* Group discussion: its own practice room with three AI classmates */}
      <Link to="/gd" className="group block rounded-2xl border border-line bg-linear-to-br from-peach via-card to-lavender p-5 sm:p-6 hover:shadow-md transition-shadow">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex -space-x-2" aria-hidden="true">
            {[['R', 'bg-peach text-peach-ink'], ['M', 'bg-lavender text-lavender-ink'], ['K', 'bg-sage text-sage-ink']].map(([l, tone]) => (
              <span key={l} className={`w-10 h-10 rounded-full grid place-items-center font-bold ring-2 ring-card ${tone}`}>{l}</span>
            ))}
          </span>
          <span className="flex-1 min-w-48">
            <span className="flex items-center gap-2"><b className="font-semibold">Group discussion (GD)</b><span className="text-[11px] font-semibold rounded-full bg-accent text-on-accent px-2 py-0.5">New</span></span>
            <span className="block text-sm text-soft mt-0.5">Discuss a topic with three AI classmates, then get scored on initiation, listening, leadership and your summary.</span>
          </span>
          <span className="font-semibold text-accent-deep inline-flex items-center gap-1">Start a GD <Icon name="arrow" size={15} className="group-hover:translate-x-0.5 transition-transform" /></span>
        </div>
      </Link>

      <section className="rounded-2xl border border-line bg-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold flex items-center gap-2"><Icon name="bolt" size={16} className="text-accent-deep" /> 5-minute drill</h2>
          {usage && <span className="text-xs text-muted">{Math.max(0, drillsLeft)} of {usage.drills.limit} drills left today</span>}
        </div>
        <p className="text-sm text-muted">Five quick questions on one topic. Great for a daily habit, or right before an interview.</p>
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
