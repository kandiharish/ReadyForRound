import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { apiFetch } from '../lib/api'
import {
  COMFORTS, DAY_IN_ROLE, DIMENSIONS, EXPERIENCES, INTEREST_CARDS, PAIRS, TASTE_TESTS, scoreCompass,
  type CompassAnswers, type CompassResult, type ComfortId, type Dim, type Experience, type PairAnswer,
} from '../lib/compass'
import { Button, Icon } from './ui'
import type { RoleOption } from '../types'

const DRAFT_KEY = 'rfr-compass-draft'
const EMPTY: CompassAnswers = { interests: {}, pairs: {}, experiences: {}, comfort: { maths: 3, coding: 3, people: 3, detail: 3 }, taste: {} }

type Step = 'intro' | 'interests' | 'pairs' | 'experience' | 'comfort' | 'tasteIntro' | 'taste' | 'result'
const PARTS: { step: Step; name: string }[] = [
  { step: 'interests', name: 'What you enjoy' },
  { step: 'pairs', name: 'This or that' },
  { step: 'experience', name: 'What you\'ve tried' },
  { step: 'comfort', name: 'Comfort check' },
  { step: 'taste', name: 'Taste tests' },
]

const ENJOY = ['Hate it', 'Not really', 'Neutral', 'Like it', 'Love it']
const EXP_OPTIONS: { id: Experience; label: string }[] = [
  { id: 'none', label: 'Not yet' }, { id: 'disliked', label: "Didn't enjoy" }, { id: 'ok', label: 'It was OK' }, { id: 'loved', label: 'Loved it' },
]

function loadDraft(): { answers: CompassAnswers; step: Step; i: number } | null {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null') } catch { return null }
}

// The Career Compass flow. Role names are never shown until the result, so people react to the work, not the hype.
export function CareerCompass({ roles, onPick, onClose }: {
  roles: RoleOption[]
  onPick: (roleId: string) => void // "Make this my goal"
  onClose?: () => void // e.g. back to the role list in onboarding
}) {
  const draft = useMemo(loadDraft, [])
  const [answers, setAnswers] = useState<CompassAnswers>(draft?.answers ?? EMPTY)
  const [step, setStep] = useState<Step>(draft && draft.step !== 'result' ? draft.step : 'intro')
  const [i, setI] = useState(draft?.i ?? 0) // index within the current part
  const [result, setResult] = useState<CompassResult | null>(null)
  const [savedId, setSavedId] = useState<number | null>(null)

  useEffect(() => {
    try {
      if (step === 'intro' || step === 'result') localStorage.removeItem(DRAFT_KEY)
      else localStorage.setItem(DRAFT_KEY, JSON.stringify({ answers, step, i }))
    } catch { /* fine */ }
  }, [answers, step, i])

  const go = (s: Step, index = 0) => { setStep(s); setI(index); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  function finish(final: CompassAnswers) {
    const r = scoreCompass(final)
    setResult(r)
    go('result')
    apiFetch<{ id: number }>('/compass', { method: 'POST', body: JSON.stringify({ answers: final, result: r }) })
      .then((row) => setSavedId(row.id)).catch(() => { /* the result still shows even if saving fails */ })
  }

  const partIndex = PARTS.findIndex((p) => p.step === (step === 'tasteIntro' ? 'taste' : step))
  const partProgress = step === 'interests' ? i / INTEREST_CARDS.length : step === 'pairs' ? i / PAIRS.length : step === 'taste' ? i / TASTE_TESTS.length : 0
  const progress = step === 'result' ? 1 : partIndex < 0 ? 0 : (partIndex + partProgress) / PARTS.length

  if (step === 'intro') return <Intro onStart={() => go('interests')} onClose={onClose} />
  if (step === 'result' && result) {
    return <Result result={result} roles={roles} savedId={savedId} onPick={onPick} showMarketLinks={!onClose}
      onRetake={() => { setAnswers(EMPTY); setResult(null); setSavedId(null); go('intro') }} />
  }

  return (
    <div className="space-y-6">
      {/* Progress through the five parts */}
      <div>
        <div className="flex items-center justify-between text-xs font-medium text-muted">
          <span>Part {Math.max(1, partIndex + 1)} of {PARTS.length} · {PARTS[Math.max(0, partIndex)].name}</span>
          <span>{Math.round(progress * 100)}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-raised overflow-hidden">
          <div className="h-full rounded-full bg-linear-to-r from-[#12a8f0] to-[#7b3cf0] transition-[width] duration-500" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      {step === 'interests' && (() => {
        const card = INTEREST_CARDS[i]
        return (
          <Panel key={card.id} kicker={`Card ${i + 1} of ${INTEREST_CARDS.length}`} title="Would you enjoy this?">
            <p className="font-display font-semibold text-3xl sm:text-4xl leading-tight text-center py-6 sm:py-10">“{card.text}”</p>
            <div className="grid grid-cols-5 gap-2">
              {ENJOY.map((label, n) => (
                <button key={label} type="button" onClick={() => {
                  setAnswers((a) => ({ ...a, interests: { ...a.interests, [card.id]: n + 1 } }))
                  if (i + 1 < INTEREST_CARDS.length) setI(i + 1); else go('pairs')
                }} className={`min-h-16 rounded-2xl border px-1 text-xs sm:text-sm font-semibold transition-all hover:-translate-y-0.5 ${
                  answers.interests[card.id] === n + 1 ? 'border-accent bg-accent-soft text-accent-deep' : 'border-line bg-card hover:border-accent'}`}>
                  <span className="block text-lg sm:text-xl mb-0.5" aria-hidden="true">{['−−', '−', '·', '+', '++'][n]}</span>{label}
                </button>
              ))}
            </div>
            <BackLink onClick={() => (i > 0 ? setI(i - 1) : go('intro'))} />
          </Panel>
        )
      })()}

      {step === 'pairs' && (() => {
        const p = PAIRS[i]
        const choose = (v: PairAnswer) => {
          setAnswers((a) => ({ ...a, pairs: { ...a.pairs, [p.id]: v } }))
          if (i + 1 < PAIRS.length) setI(i + 1); else go('experience')
        }
        return (
          <Panel key={p.id} kicker={`Choice ${i + 1} of ${PAIRS.length}`} title="Which would you rather do all week?">
            <div className="grid gap-3 sm:grid-cols-2 mt-2">
              {(['a', 'b'] as const).map((k) => (
                <button key={k} type="button" onClick={() => choose(k)}
                  className={`min-h-36 rounded-3xl border-2 p-6 text-left font-display font-semibold text-2xl leading-snug transition-all hover:-translate-y-1 hover:shadow-lg ${
                    answers.pairs[p.id] === k ? 'border-accent bg-accent-soft' : 'border-line bg-card hover:border-accent'}`}>
                  {p[k].text}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4">
              <BackLink onClick={() => (i > 0 ? setI(i - 1) : go('interests', INTEREST_CARDS.length - 1))} />
              <button type="button" onClick={() => choose('both')} className="text-sm font-medium text-muted hover:text-ink rounded-lg px-3 py-2 hover:bg-raised">Both equally</button>
            </div>
          </Panel>
        )
      })()}

      {step === 'experience' && (
        <Panel kicker="Real experience counts most" title="What have you actually tried, and how did it feel?">
          <ul className="space-y-3 mt-2">
            {EXPERIENCES.map((e) => (
              <li key={e.id} className="rounded-2xl border border-line bg-card p-4">
                <p className="font-medium">{e.text}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                  {EXP_OPTIONS.map((o) => {
                    const on = (answers.experiences[e.id] ?? 'none') === o.id
                    return (
                      <button key={o.id} type="button" onClick={() => setAnswers((a) => ({ ...a, experiences: { ...a.experiences, [e.id]: o.id } }))}
                        className={`min-h-10 rounded-xl border text-sm transition-colors ${on ? 'border-accent bg-accent-soft text-accent-deep font-semibold' : 'border-line hover:border-accent text-soft'}`}>
                        {o.label}
                      </button>
                    )
                  })}
                </div>
              </li>
            ))}
          </ul>
          <NavRow onBack={() => go('pairs', PAIRS.length - 1)} onNext={() => go('comfort')} />
        </Panel>
      )}

      {step === 'comfort' && (
        <Panel kicker="Be honest: this keeps the result realistic" title="How do you feel about these?">
          <ul className="space-y-5 mt-2">
            {COMFORTS.map((c) => (
              <li key={c.id} className="rounded-2xl border border-line bg-card p-4 sm:p-5">
                <p className="font-semibold">{c.text}</p>
                <div className="grid grid-cols-5 gap-2 mt-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setAnswers((a) => ({ ...a, comfort: { ...a.comfort, [c.id]: n } as Record<ComfortId, number> }))}
                      aria-label={`${c.text}: ${n} of 5`}
                      className={`h-11 rounded-xl border font-mono font-semibold transition-colors ${answers.comfort[c.id] === n ? 'border-accent bg-accent text-on-accent' : 'border-line hover:border-accent'}`}>{n}</button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted mt-1.5"><span>{c.low}</span><span>{c.high}</span></div>
              </li>
            ))}
          </ul>
          <NavRow onBack={() => go('experience')} onNext={() => go('tasteIntro')} />
        </Panel>
      )}

      {step === 'tasteIntro' && (
        <Panel kicker="Optional, but recommended" title="Try 5 one-minute tasks">
          <p className="text-soft mt-2 max-w-xl">
            Imagining work is different from doing it. Try five tiny real tasks: a bug, a chart, a design, a security risk and an outage.
            <b className="text-ink"> What matters is whether you enjoyed each one</b>, not whether you got it right.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Button onClick={() => go('taste')}><Icon name="play" size={16} /> Try the tasks</Button>
            <Button variant="secondary" onClick={() => finish(answers)}>Skip and see my result</Button>
          </div>
          <BackLink onClick={() => go('comfort')} />
        </Panel>
      )}

      {step === 'taste' && (
        <TasteTest key={TASTE_TESTS[i].id} index={i} answer={answers.taste[TASTE_TESTS[i].id]}
          onDone={(ans) => {
            const next = { ...answers, taste: { ...answers.taste, [TASTE_TESTS[i].id]: ans } }
            setAnswers(next)
            if (i + 1 < TASTE_TESTS.length) setI(i + 1); else finish(next)
          }}
          onBack={() => (i > 0 ? setI(i - 1) : go('tasteIntro'))} />
      )}
    </div>
  )
}

function Panel({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-card border border-line p-5 sm:p-8 shadow-sm motion-safe:animate-[pop-in_0.35s_ease-out]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{kicker}</p>
      <h2 className="font-display font-semibold text-3xl mt-1">{title}</h2>
      {children}
    </section>
  )
}

const BackLink = ({ onClick }: { onClick: () => void }) => (
  <button type="button" onClick={onClick} className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
    <Icon name="arrow" size={15} className="rotate-180" /> Back
  </button>
)
const NavRow = ({ onBack, onNext }: { onBack: () => void; onNext: () => void }) => (
  <div className="flex items-center justify-between mt-6">
    <BackLink onClick={onBack} />
    <Button onClick={onNext}>Next <Icon name="arrow" size={16} /></Button>
  </div>
)

function Intro({ onStart, onClose }: { onStart: () => void; onClose?: () => void }) {
  const steps: [string, string][] = [
    ['What you enjoy', '12 quick cards'], ['This or that', '10 choices'], ["What you've tried", 'Real experience'], ['Comfort check', '4 honest questions'], ['Taste tests', '5 tiny tasks (optional)'],
  ]
  return (
    <section className="relative overflow-hidden rounded-3xl border border-line bg-linear-to-br from-lavender via-sky to-sage p-6 sm:p-10">
      <div aria-hidden="true" className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-card/40 blur-3xl motion-safe:animate-[blob-drift_18s_ease-in-out_infinite]" />
      <div className="relative max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1 text-xs font-semibold text-lavender-ink"><Icon name="target" size={14} /> Career Compass</span>
        <h2 className="font-display font-semibold text-4xl sm:text-5xl leading-[1.05] mt-4">Find the role that fits how you like to work.</h2>
        <p className="text-soft mt-3 text-lg">Not what's trending. Not what your friends picked. You'll react to real work, and we'll match it to 13 tech roles.</p>
        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
          {steps.map(([t, d], n) => (
            <li key={t} className="flex items-center gap-3 rounded-xl bg-card/75 px-3 py-2.5">
              <span className="w-7 h-7 rounded-lg bg-accent-soft text-accent-deep text-xs font-bold flex items-center justify-center">{n + 1}</span>
              <span className="text-sm"><b>{t}</b> <span className="text-muted">· {d}</span></span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-soft mt-5">About 8 to 10 minutes. Role names stay hidden until the end, so your answers stay honest.</p>
        <div className="flex flex-wrap gap-3 mt-6">
          <Button onClick={onStart} className="min-h-12 px-6"><Icon name="play" size={16} /> Start</Button>
          {onClose && <Button variant="secondary" onClick={onClose}>Pick a role myself</Button>}
        </div>
      </div>
    </section>
  )
}

function TasteTest({ index, answer, onDone, onBack }: { index: number; answer?: { choice: number | null; enjoyed: number }; onDone: (a: { choice: number | null; enjoyed: number }) => void; onBack: () => void }) {
  const t = TASTE_TESTS[index]
  const [choice, setChoice] = useState<number | null>(answer?.choice ?? null)
  return (
    <Panel kicker={`Task ${index + 1} of ${TASTE_TESTS.length} · ${t.title}`} title={t.prompt}>
      {'code' in t && <pre className="mt-4 rounded-2xl bg-raised border border-line p-4 text-sm font-mono overflow-x-auto leading-relaxed">{t.code.split('\n').map((l, n) => <div key={n}><span className="text-muted select-none mr-4">{n + 1}</span>{l}</div>)}</pre>}
      {'chart' in t && (
        <div className="mt-4 rounded-2xl bg-raised border border-line p-4 flex items-end gap-3 h-48">
          {t.chart.map(([m, v]) => (
            <div key={m} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
              <span className="text-xs font-mono text-muted">{v}</span>
              <div className="w-full rounded-t-lg bg-linear-to-t from-[#3354d6] to-[#7b9bff]" style={{ height: `${(v / 480) * 100}%` }} />
              <span className="text-xs font-medium">{m}</span>
            </div>
          ))}
        </div>
      )}
      {t.id === 't3' && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-[#e9e9e9] p-4 text-[#9a9a9a]">
            <p className="text-xs font-semibold">CARD A</p>
            <p className="text-sm mt-2">sign up now for our app and get access to all the features today</p>
            <div className="h-7 rounded bg-[#dcdcdc] mt-2" />
            <div className="flex gap-1 mt-2">{['Submit', 'Cancel', 'Help'].map((b) => <span key={b} className="flex-1 text-center text-xs rounded bg-[#d4d4d4] py-1.5">{b}</span>)}</div>
          </div>
          <div className="rounded-2xl border border-line bg-white p-4 text-[#0f172a]">
            <p className="text-xs font-semibold text-[#5a6577]">CARD B</p>
            <p className="font-bold mt-2">Create your account</p>
            <p className="text-xs text-[#5a6577] mt-2">Email</p>
            <div className="h-8 rounded-lg border border-[#c7d0de] mt-1" />
            <span className="block text-center text-sm font-semibold rounded-lg bg-[#3354d6] text-white py-2 mt-3">Sign up</span>
          </div>
        </div>
      )}
      <div className="grid gap-2 sm:grid-cols-2 mt-4">
        {t.options.map((o, n) => {
          const picked = choice === n
          const shown = choice !== null
          const correct = n === t.answer
          return (
            <button key={o} type="button" disabled={shown} onClick={() => setChoice(n)}
              className={`min-h-12 rounded-xl border px-4 text-left text-sm transition-colors ${
                shown && correct ? 'border-good bg-sage text-sage-ink font-semibold' : shown && picked ? 'border-bad/50 bg-blush text-blush-ink' : shown ? 'border-line opacity-60' : 'border-line bg-card hover:border-accent'}`}>
              {o}
            </button>
          )
        })}
      </div>
      {choice !== null && (
        <div className="mt-6 rounded-2xl bg-raised p-4 motion-safe:animate-[pop-in_0.3s_ease-out]">
          <p className="font-semibold">{choice === t.answer ? 'Nice, that\'s right.' : 'Not quite, and that\'s fine.'} Did you enjoy that task?</p>
          <div className="grid grid-cols-5 gap-2 mt-3">
            {['Not at all', 'A little', 'Neutral', 'Quite a lot', 'Loved it'].map((l, n) => (
              <button key={l} type="button" onClick={() => onDone({ choice, enjoyed: n + 1 })}
                className="min-h-12 rounded-xl border border-line bg-card text-xs sm:text-sm font-semibold hover:border-accent hover:bg-accent-soft">{l}</button>
            ))}
          </div>
        </div>
      )}
      <BackLink onClick={onBack} />
    </Panel>
  )
}

function Result({ result, roles, savedId, onPick, onRetake, showMarketLinks }: { result: CompassResult; roles: RoleOption[]; savedId: number | null; onPick: (role: string) => void; onRetake: () => void; showMarketLinks: boolean }) {
  const name = (id: string) => roles.find((r) => r.id === id)?.label ?? id
  const top = result.matches.slice(0, 3)
  const dims = (Object.entries(result.dims) as [Dim, number][]).sort((a, b) => b[1] - a[1])
  const [fit, setFit] = useState<'yes' | 'partly' | 'no' | null>(null)
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)
  // A popular role that ranked low, explained ("why not")
  const whyNot = result.matches.slice(3).find((m) => m.concerns.length > 0)

  function sendFit() {
    if (!savedId || !fit) return
    apiFetch(`/compass/${savedId}/fit`, { method: 'POST', body: JSON.stringify({ fit, note: note || undefined }) }).catch(() => {})
    setSent(true)
  }

  return (
    <div className="space-y-6 motion-safe:animate-[pop-in_0.4s_ease-out]">
      <section className="relative overflow-hidden rounded-3xl border border-line bg-linear-to-br from-lavender via-sky to-sage p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lavender-ink">Your Career Compass</p>
        <h2 className="font-display font-semibold text-4xl sm:text-5xl leading-tight mt-2">{name(top[0].role)}</h2>
        <p className="text-soft mt-2">fits how you like to work best. Here are your top 3 matches.</p>
        <span className={`inline-flex mt-4 rounded-full px-3 py-1 text-xs font-semibold ${result.confidence === 'high' ? 'bg-sage text-sage-ink' : result.confidence === 'medium' ? 'bg-sky text-sky-ink' : 'bg-peach text-peach-ink'}`}>
          {result.confidence === 'high' ? 'Clear result' : result.confidence === 'medium' ? 'Fairly clear result' : 'Early result: explore a little more'}
        </span>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {top.map((m, n) => (
          <article key={m.role} className={`rounded-3xl border bg-card p-5 sm:p-6 flex flex-col ${n === 0 ? 'border-accent shadow-md' : 'border-line'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted">#{n + 1} match</span>
              <span className="font-display font-semibold text-3xl text-accent-deep">{m.percent}%</span>
            </div>
            <h3 className="font-semibold text-xl mt-1">{name(m.role)}</h3>
            <div className="h-1.5 rounded-full bg-raised mt-3 overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${m.percent}%` }} /></div>
            <p className="text-sm text-soft mt-4"><b className="text-ink">A day in this role:</b> {DAY_IN_ROLE[m.role]}</p>
            {m.reasons.length > 0 && (
              <ul className="mt-4 space-y-1.5 text-sm">
                {m.reasons.map((r) => <li key={r} className="flex gap-2"><Icon name="check" size={15} className="text-good shrink-0 mt-0.5" /><span>{r}</span></li>)}
              </ul>
            )}
            {m.concerns.map((c) => <p key={c} className="text-xs text-peach-ink bg-peach rounded-lg px-2.5 py-2 mt-3">{c}</p>)}
            <div className="flex-1" />
            <Button onClick={() => onPick(m.role)} variant={n === 0 ? 'primary' : 'secondary'} className="mt-5 w-full">Make this my goal</Button>
            {showMarketLinks && <Link to={`/market/${m.role}`} className="mt-2 text-center text-sm font-medium text-accent-deep hover:underline">Openings, pay and skills →</Link>}
          </article>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-3xl border border-line bg-card p-5 sm:p-6">
          <h3 className="font-semibold">How you like to work</h3>
          <ul className="mt-4 space-y-3">
            {dims.map(([d, v]) => (
              <li key={d}>
                <div className="flex justify-between text-sm"><span>{DIMENSIONS[d]}</span><span className="font-mono text-muted">{v}</span></div>
                <div className="h-2 rounded-full bg-raised mt-1 overflow-hidden"><div className="h-full rounded-full bg-linear-to-r from-[#12a8f0] to-[#7b3cf0] transition-[width] duration-700" style={{ width: `${Math.max(4, v)}%` }} /></div>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-4">
          {(result.notes.length > 0 || whyNot) && (
            <section className="rounded-3xl border border-line bg-card p-5 sm:p-6 space-y-3">
              <h3 className="font-semibold">Honest notes</h3>
              {result.notes.map((n) => <p key={n} className="text-sm text-soft">{n}</p>)}
              {whyNot && <p className="text-sm text-soft"><b className="text-ink">Why not {name(whyNot.role)}?</b> {whyNot.concerns[0]}</p>}
            </section>
          )}
          <section className="rounded-3xl border border-line bg-card p-5 sm:p-6">
            <h3 className="font-semibold">Does this feel right?</h3>
            {sent ? (
              <p className="text-sm text-good mt-2">Thanks! Your answer helps make Career Compass more accurate for everyone.</p>
            ) : (
              <>
                <div className="flex gap-2 mt-3">
                  {([['yes', 'Yes'], ['partly', 'Partly'], ['no', 'Not really']] as const).map(([v, l]) => (
                    <button key={v} type="button" onClick={() => setFit(v)}
                      className={`flex-1 min-h-11 rounded-xl border text-sm font-medium ${fit === v ? 'border-accent bg-accent-soft text-accent-deep' : 'border-line hover:border-accent'}`}>{l}</button>
                  ))}
                </div>
                {fit && fit !== 'yes' && (
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2} placeholder="What role did you expect, and why? (optional)"
                    className="mt-3 w-full rounded-xl bg-raised border border-line-strong px-3 py-2 text-sm" />
                )}
                {fit && <Button onClick={sendFit} disabled={!savedId} className="mt-3 w-full">Send</Button>}
              </>
            )}
          </section>
          <button type="button" onClick={onRetake} className="text-sm font-medium text-muted hover:text-ink">Retake Career Compass</button>
        </div>
      </div>
    </div>
  )
}
