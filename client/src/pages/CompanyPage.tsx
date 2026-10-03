import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useMe } from '../auth/MeProvider'
import { apiFetch } from '../lib/api'
import { startDrill } from '../lib/sessions'
import { Button, Card, EmptyState, Icon, Spinner } from '../components/ui'
import { CompanyMark, NotAffiliated } from './Companies'
import type { Interview, RoundId } from '../types'

type PracticeQuestion = { round: RoundId; question: string; topic: string; tip: string; answer: string }

export default function CompanyPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { me, catalog, label, usage, refreshUsage } = useMe()
  const company = catalog?.companies.find((c) => c.id === id)
  const goalRole = me?.active_goal?.target_role
  const [role, setRole] = useState<string | null>(null)
  const [starting, setStarting] = useState<string | null>(null) // which button is starting
  const [error, setError] = useState<string | null>(null)
  const [bank, setBank] = useState<PracticeQuestion[] | null>(null)
  const [bankError, setBankError] = useState<string | null>(null)

  // Default role: the student's goal role if this company hires for it.
  const activeRole = role ?? (company && goalRole && company.roles.includes(goalRole) ? goalRole : company?.roles[0]) ?? null

  useEffect(() => {
    if (!company || !activeRole) return
    setBank(null)
    setBankError(null)
    apiFetch<PracticeQuestion[]>(`/companies/${company.id}/questions?role=${activeRole}`)
      .then(setBank)
      .catch((err) => setBankError((err as Error).message))
  }, [company, activeRole])

  if (!catalog || !me) return <Spinner />
  if (!company) return <EmptyState title="Company not found" body="It may have been renamed." action={<Link to="/companies" className="text-accent-deep font-semibold">All companies</Link>} />

  const interviewsLeft = usage ? usage.interviews.limit - usage.interviews.used : 1
  const roundName = (r: RoundId) => company.rounds.find((x) => x.id === r)?.label ?? r

  async function start(key: string, body: object) {
    setStarting(key)
    setError(null)
    try {
      const iv = await apiFetch<Interview>('/interviews', { method: 'POST', body: JSON.stringify({ ...body, companyId: company!.id, roleId: activeRole }) })
      refreshUsage()
      navigate(`/interview/${iv.id}`)
    } catch (err) {
      setError((err as Error).message)
      setStarting(null)
    }
  }

  async function practise(q: PracticeQuestion, i: number) {
    setStarting(`q${i}`)
    setError(null)
    try {
      const iv = await startDrill((q.topic || q.question).slice(0, 80))
      refreshUsage()
      navigate(`/interview/${iv.id}`)
    } catch (err) {
      setError((err as Error).message)
      setStarting(null)
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/companies" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <Icon name="arrow" size={15} className="rotate-180" /> All companies
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-center gap-5">
        <CompanyMark company={company} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{label('companyTypes', company.type)}</p>
          <h1 className="font-display font-semibold text-4xl sm:text-5xl leading-tight">{company.name}-style interview</h1>
          <p className="text-soft mt-1">{company.tagline}</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr] items-start">
        {/* How they hire */}
        <Card className="space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><Icon name="map" size={17} className="text-accent" /> How {company.name} hires</h2>
          <ol className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-line-strong">
            {company.hiring.map((step, i) => (
              <li key={step} className="relative text-sm">
                <span className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-accent-soft border-2 border-accent flex items-center justify-center text-[9px] font-bold text-accent-deep">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
          <div className="rounded-xl bg-raised p-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">What they look for</p>
            <p className="text-soft mt-1">{company.lookFor[0].toUpperCase() + company.lookFor.slice(1)}.</p>
          </div>
          <p className="text-xs text-muted">Based on publicly reported candidate experiences. Online tests aren't simulated; our mock interview covers the interview rounds.</p>
        </Card>

        {/* Mock interview */}
        <Card className="space-y-5">
          <div>
            <h2 className="font-semibold flex items-center gap-2"><Icon name="mic" size={17} className="text-accent" /> Your mock interview</h2>
            <p className="text-sm text-muted mt-1">Choose the role, then take the full interview or practise one round.</p>
          </div>

          <div role="radiogroup" aria-label="Role" className="flex flex-wrap gap-2">
            {company.roles.map((r) => (
              <button key={r} type="button" role="radio" aria-checked={activeRole === r} onClick={() => setRole(r)}
                className={`rounded-full px-3.5 py-1.5 text-sm border transition-colors ${activeRole === r ? 'bg-accent border-accent text-on-accent font-semibold' : 'border-line-strong text-soft hover:border-accent'}`}>
                {label('roles', r)}
              </button>
            ))}
          </div>

          <ol className="space-y-2">
            {company.rounds.map((r, i) => (
              <li key={r.id} className="flex items-start gap-3 rounded-xl border border-line p-3">
                <span className="w-7 h-7 shrink-0 rounded-lg bg-raised flex items-center justify-center text-xs font-bold text-soft">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{r.label}</p>
                  <p className="text-xs text-muted mt-0.5 line-clamp-2">{r.focus}</p>
                </div>
                <button type="button" onClick={() => start(r.id, { mode: 'single', round: r.id })} disabled={!!starting || interviewsLeft <= 0}
                  className="shrink-0 text-xs font-semibold text-accent-deep rounded-lg px-2.5 py-1.5 hover:bg-accent-soft disabled:opacity-40">
                  {starting === r.id ? 'Starting…' : 'Practise'}
                </button>
              </li>
            ))}
          </ol>

          <Button onClick={() => start('complete', { mode: 'complete' })} disabled={!!starting || interviewsLeft <= 0} className="w-full justify-center min-h-12">
            <Icon name="play" size={16} /> {starting === 'complete' ? 'Preparing your interviewer…' : interviewsLeft <= 0 ? 'Daily limit reached' : `Start full ${company.name}-style interview`}
          </Button>
          {error && <p className="text-sm text-bad" role="alert">{error}</p>}
          <p className="text-xs text-muted">Your report will include a "{company.name} bar" section: how your answers compare with what they look for.</p>
        </Card>
      </div>

      {/* Practice question bank */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display font-semibold text-3xl">Practice questions</h2>
            <p className="text-sm text-muted">In {company.name}'s style for {label('roles', activeRole ?? '')}. Written by AI to match their reported process, not leaked questions.</p>
          </div>
        </div>

        {bankError ? (
          <Card><p className="text-sm text-bad">{bankError}</p></Card>
        ) : !bank ? (
          <Card className="flex items-center gap-4">
            <span className="w-9 h-9 rounded-full border-2 border-accent border-t-transparent animate-spin shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">Preparing practice questions…</p>
              <p className="text-sm text-muted">The first time for each company and role takes about 20 seconds. After that it's instant.</p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {company.rounds.map((r) => {
              const qs = bank.map((q, i) => ({ q, i })).filter(({ q }) => q.round === r.id)
              if (!qs.length) return null
              return (
                <Card key={r.id} className="space-y-3">
                  <h3 className="font-semibold">{roundName(r.id)}</h3>
                  <ul className="divide-y divide-line">
                    {qs.map(({ q, i }) => <QuestionItem key={i} q={q} busy={starting === `q${i}`} disabled={!!starting} onPractise={() => practise(q, i)} />)}
                  </ul>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      <NotAffiliated />
    </div>
  )
}

function QuestionItem({ q, busy, disabled, onPractise }: { q: PracticeQuestion; busy: boolean; disabled: boolean; onPractise: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <li className="py-3 first:pt-0">
      <p className="text-sm font-medium text-ink">{q.question}</p>
      {q.tip && <p className="text-xs text-muted mt-1"><span className="font-semibold text-accent-deep">Tip:</span> {q.tip}</p>}
      <div className="flex flex-wrap gap-2 mt-2">
        {q.answer && (
          <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
            className="text-xs font-semibold text-soft rounded-lg px-2.5 py-1.5 bg-raised hover:bg-hover">
            {open ? 'Hide answer' : 'Show a strong answer'}
          </button>
        )}
        <button type="button" onClick={onPractise} disabled={disabled}
          className="text-xs font-semibold text-accent-deep rounded-lg px-2.5 py-1.5 hover:bg-accent-soft disabled:opacity-40 inline-flex items-center gap-1">
          <Icon name="bolt" size={13} /> {busy ? 'Starting…' : `Drill: ${q.topic || 'this topic'}`}
        </button>
      </div>
      {open && <p className="text-sm text-soft bg-accent-soft rounded-lg p-3 mt-2 leading-relaxed">{q.answer}</p>}
    </li>
  )
}
