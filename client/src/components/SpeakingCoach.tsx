import type { ReactNode } from 'react'
import { Icon } from './ui'
import type { InterviewTurn, SpeechStats } from '../types'

// Speaking coach: how the answers sounded (speed, filler words, length, pauses), from the spoken answers only.
// Rule-based: the numbers come from the transcript and its timings, not from AI judgement.

const PACE = { slow: 110, fast: 165 } // words per minute; clear interview speech is roughly in between
const fillerTotal = (s: SpeechStats) => Object.values(s.fillers).reduce((a, b) => a + b, 0)

export function summariseSpeech(turns: InterviewTurn[]) {
  const spoken = turns.filter((t): t is InterviewTurn & { speech: SpeechStats } => !!t.speech && t.speech.words > 0)
  if (spoken.length === 0) return null
  const timed = spoken.filter((t) => t.speech.wpm > 0)
  const words = timed.reduce((a, t) => a + t.speech.words, 0)
  const wpm = words ? Math.round(timed.reduce((a, t) => a + t.speech.wpm * t.speech.words, 0) / words) : null
  const seconds = spoken.reduce((a, t) => a + t.speech.seconds, 0)
  const fillers: Record<string, number> = {}
  for (const t of spoken) for (const [k, v] of Object.entries(t.speech.fillers)) fillers[k] = (fillers[k] ?? 0) + v
  const fillerCount = Object.values(fillers).reduce((a, b) => a + b, 0)
  return {
    answers: spoken.length,
    wpm,
    avgSeconds: Math.round(seconds / spoken.length),
    perMinute: seconds > 0 ? Math.round((fillerCount / (seconds / 60)) * 10) / 10 : 0,
    fillerCount,
    topFillers: Object.entries(fillers).sort((a, b) => b[1] - a[1]).slice(0, 4),
    pauses: spoken.reduce((a, t) => a + t.speech.pauses, 0),
  }
}

type Summary = NonNullable<ReturnType<typeof summariseSpeech>>

function tips(s: Summary) {
  const out: string[] = []
  if (s.topFillers[0] && s.perMinute > 2) out.push(`You said “${s.topFillers[0][0]}” ${s.topFillers[0][1]} times. Next time, swap it for a short silent pause: a pause sounds calm and confident, a filler sounds unsure.`)
  if (s.wpm !== null && s.wpm > PACE.fast) out.push('You spoke quickly. Slow down a little and pause after each key point, so the interviewer can note it down.')
  if (s.wpm !== null && s.wpm < PACE.slow) out.push('You spoke slowly. Plan the first sentence before you start: “There are three parts to this…” keeps you moving.')
  if (s.avgSeconds < 30) out.push('Your answers were short. Add one real example: the situation, what you did, and the result.')
  if (s.avgSeconds > 150) out.push('Your answers ran long. Lead with the answer in one sentence, then give one example, then stop.')
  if (s.pauses >= 3) out.push('A few long silences. Thinking is fine: say “Let me think about that for a second” so the silence feels planned.')
  if (out.length === 0) out.push('Clear, steady delivery with few fillers. Keep this up in the real interview.')
  return out.slice(0, 3)
}

function Stat({ label, value, note, tone, children }: { label: string; value: string; note: string; tone: 'good' | 'warn'; children?: ReactNode }) {
  return (
    <div className="rounded-xl bg-raised p-4 flex flex-col gap-1 min-w-0">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-bold text-3xl leading-none tabular-nums tracking-tight text-ink">{value}</p>
      <p className={`text-xs font-semibold ${tone === 'good' ? 'text-good' : 'text-warn'}`}>{note}</p>
      {children}
    </div>
  )
}

export function SpeakingCoach({ turns }: { turns: InterviewTurn[] }) {
  const s = summariseSpeech(turns)
  if (!s) {
    // Typed answers only: a gentle nudge, since delivery is half of an interview
    if (!turns.some((t) => t.answer)) return null
    return (
      <section className="rounded-2xl border border-dashed border-line-strong p-5 flex gap-3 items-start">
        <Icon name="mic" size={20} className="text-accent shrink-0 mt-0.5" />
        <p className="text-sm text-soft"><b className="text-ink">Want a speaking coach?</b> Answer by voice next time and we'll show your speaking speed, filler words and pauses.</p>
      </section>
    )
  }

  const paceNote = s.wpm === null ? 'Answers too short to measure' : s.wpm > PACE.fast ? 'A bit fast' : s.wpm < PACE.slow ? 'A bit slow' : 'Clear and steady'
  // Marker on a 60-220 wpm track
  const marker = s.wpm === null ? null : Math.min(100, Math.max(0, ((s.wpm - 60) / 160) * 100))
  const zone = (v: number) => ((v - 60) / 160) * 100

  return (
    <section className="bg-card border border-line rounded-2xl p-6 space-y-5">
      <div>
        <h2 className="font-display font-semibold text-2xl text-ink flex items-center gap-2"><Icon name="mic" size={18} className="text-accent" /> Speaking coach</h2>
        <p className="text-sm text-muted mt-1">How your {s.answers} spoken {s.answers === 1 ? 'answer' : 'answers'} sounded. Measured from your words and timing, not judged by AI.</p>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Stat label="Speaking speed" value={s.wpm === null ? '—' : `${s.wpm}`} note={paceNote} tone={paceNote === 'Clear and steady' ? 'good' : 'warn'}>
          {marker !== null && (
            <div className="mt-2" aria-hidden="true">
              <div className="relative h-2 rounded-full bg-hover">
                <div className="absolute inset-y-0 rounded-full bg-good/40" style={{ left: `${zone(PACE.slow)}%`, width: `${zone(PACE.fast) - zone(PACE.slow)}%` }} />
                <span className="absolute -top-1 w-4 h-4 -ml-2 rounded-full bg-card border-[3px] border-accent" style={{ left: `${marker}%` }} />
              </div>
              <p className="text-[11px] text-muted mt-1.5">words a minute · aim for {PACE.slow}–{PACE.fast}</p>
            </div>
          )}
        </Stat>
        <Stat label="Filler words" value={`${s.perMinute}`} note={s.perMinute <= 2 ? 'Very few' : s.perMinute <= 4 ? 'A few' : 'Quite a lot'} tone={s.perMinute <= 2 ? 'good' : 'warn'}>
          <p className="text-[11px] text-muted">per minute · {s.fillerCount} in total</p>
          {s.topFillers.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {s.topFillers.map(([w, n]) => <span key={w} className="rounded-full bg-card px-2 py-0.5 text-[11px] text-soft">“{w}” ×{n}</span>)}
            </div>
          )}
        </Stat>
        <Stat label="Average answer" value={`${s.avgSeconds}s`} note={s.avgSeconds < 30 ? 'Short' : s.avgSeconds > 150 ? 'Long' : 'Good length'} tone={s.avgSeconds < 30 || s.avgSeconds > 150 ? 'warn' : 'good'}>
          <p className="text-[11px] text-muted">strong answers often take 45–120 seconds</p>
        </Stat>
        <Stat label="Long pauses" value={`${s.pauses}`} note={s.pauses < 3 ? 'Fine' : 'Several'} tone={s.pauses < 3 ? 'good' : 'warn'}>
          <p className="text-[11px] text-muted">silences over 2.5 seconds mid-answer</p>
        </Stat>
      </div>

      <ul className="space-y-2">
        {tips(s).map((t) => (
          <li key={t} className="flex gap-2.5 text-sm text-soft"><Icon name="bolt" size={16} className="text-accent shrink-0 mt-0.5" /><span>{t}</span></li>
        ))}
      </ul>
    </section>
  )
}

// A small line under each question: how that one answer sounded
export function SpeechLine({ speech }: { speech: SpeechStats }) {
  const f = fillerTotal(speech)
  return (
    <p className="mt-3 inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-raised px-2.5 py-1 text-xs text-muted">
      <Icon name="mic" size={13} />
      <span>{speech.seconds}s</span>
      {speech.wpm > 0 && <span>{speech.wpm} words/min</span>}
      <span>{f === 0 ? 'no fillers' : `${f} filler${f === 1 ? '' : 's'}`}</span>
      {speech.pauses > 0 && <span>{speech.pauses} long pause{speech.pauses === 1 ? '' : 's'}</span>}
    </p>
  )
}
