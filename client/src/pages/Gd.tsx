import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useMe } from '../auth/MeProvider'
import { apiFetch } from '../lib/api'
import { isRecordingSupported, startRecording, type Recording } from '../lib/recorder'
import { isSpeechSupported, loadVoices, pickVoice, speak, stopSpeaking, voiceGender } from '../lib/speech'
import { useFeedback } from '../components/Feedback'
import { SpeakingCoach } from '../components/SpeakingCoach'
import { Button, Card, EmptyState, Icon, PageHeader, ScoreRing } from '../components/ui'
import { ListSkeleton } from '../components/Skeleton'
import type { InterviewTurn, SpeechStats } from '../types'

// Group discussion (GD) practice: discuss a topic with three AI classmates, then get a GD evaluator's report.

type Who = 'moderator' | 'rohan' | 'meera' | 'kabir' | 'you'
type GdMessage = { who: Who; text: string; pass?: boolean; speech?: SpeechStats | null }
type GdReport = {
  overall: number
  summary: string
  criteria: { id: string; score: number; note: string }[]
  strengths: string[]
  improvements: string[]
  betterPoints: { point: string; why: string }[]
  facts: { opened: boolean; spokeTurns: number; passedTurns: number; avgWords: number; namesMentioned: number; summarised: boolean }
}
type Gd = {
  id: string
  topic: string
  category: string
  status: 'in_progress' | 'completed' | 'ended_early'
  phase: 'discussion' | 'summary' | 'done'
  student_turns: number
  turnsTotal: number
  messages: GdMessage[]
  report_status: 'none' | 'generating' | 'ready' | 'failed'
  report: GdReport | null
  created_at: string
}
type Topic = { id: string; title: string; category: string }
type Criterion = { id: string; label: string; what: string }
type GdListItem = { id: string; topic: string; category: string; status: Gd['status']; report_status: Gd['report_status']; score: number | null; created_at: string }

// Each person at the table has a colour, so the transcript is easy to follow
const SEAT: Record<Who, { name: string; tone: string; ring: string; bubble: string }> = {
  moderator: { name: 'Moderator', tone: 'bg-raised text-soft', ring: 'ring-line-strong', bubble: 'bg-raised' },
  rohan: { name: 'Rohan', tone: 'bg-peach text-peach-ink', ring: 'ring-peach-ink', bubble: 'bg-peach/60' },
  meera: { name: 'Meera', tone: 'bg-lavender text-lavender-ink', ring: 'ring-lavender-ink', bubble: 'bg-lavender/60' },
  kabir: { name: 'Kabir', tone: 'bg-sage text-sage-ink', ring: 'ring-sage-ink', bubble: 'bg-sage/60' },
  you: { name: 'You', tone: 'bg-sky text-sky-ink', ring: 'ring-sky-ink', bubble: 'bg-accent-soft' },
}
const CLASSMATES: Who[] = ['rohan', 'meera', 'kabir']

// ---------- Start page: pick a topic ----------
export default function GdHome() {
  const { usage, refreshUsage } = useMe()
  const navigate = useNavigate()
  const [topics, setTopics] = useState<Topic[]>([])
  const [criteria, setCriteria] = useState<Criterion[]>([])
  const [past, setPast] = useState<GdListItem[] | null>(null)
  const [category, setCategory] = useState('All')
  const [picked, setPicked] = useState<string>('random')
  const [custom, setCustom] = useState('')
  const [youStart, setYouStart] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<{ topics: Topic[]; criteria: Criterion[] }>('/gd/topics').then((r) => { setTopics(r.topics); setCriteria(r.criteria) }).catch((e) => setError(e.message))
    apiFetch<GdListItem[]>('/gd').then(setPast).catch(() => setPast([]))
  }, [])

  const categories = ['All', ...new Set(topics.map((t) => t.category))]
  const shown = topics.filter((t) => category === 'All' || t.category === category)
  const left = usage ? usage.interviews.limit - usage.interviews.used : 1

  async function start() {
    if (picked === 'custom' && custom.trim().length < 5) return setError('Write your topic first (at least a few words).')
    setStarting(true)
    setError(null)
    try {
      const body = picked === 'custom' ? { customTopic: custom.trim(), youStart } : picked === 'random' ? { youStart } : { topicId: picked, youStart }
      const gd = await apiFetch<Gd>('/gd', { method: 'POST', body: JSON.stringify(body) })
      refreshUsage()
      navigate(`/gd/${gd.id}`)
    } catch (err) {
      setError((err as Error).message)
      setStarting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Practice" title="Group discussion"
        subtitle="Most campus drives have a GD round. Discuss a topic with three AI classmates who think differently, then see how a GD evaluator would score you." />

      {/* The three classmates */}
      <section className="rounded-2xl border border-line bg-card p-5 sm:p-6">
        <p className="text-xs font-semibold text-peach-ink">Your group</p>
        <ul className="grid gap-3 sm:grid-cols-3 mt-3">
          {[
            ['rohan', 'Confident and quick to take charge. Sometimes talks over others.'],
            ['meera', 'Calm, practical, brings real Indian examples and weighs both sides.'],
            ['kabir', 'Friendly, but sometimes makes a weak point you can politely challenge.'],
          ].map(([id, note]) => (
            <li key={id} className="flex items-start gap-3 rounded-xl bg-card/80 p-3">
              <Seat who={id as Who} size="sm" />
              <span className="min-w-0"><b className="block text-sm">{SEAT[id as Who].name}</b><span className="text-xs text-muted">{note}</span></span>
            </li>
          ))}
        </ul>
      </section>

      <Card className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-semibold">Choose a topic</h2>
          <div role="tablist" aria-label="Topic categories" className="flex gap-1 rounded-xl bg-raised p-1 overflow-x-auto [scrollbar-width:none] max-w-full">
            {categories.map((c) => (
              <button key={c} type="button" role="tab" aria-selected={category === c} onClick={() => setCategory(c)}
                className={`shrink-0 min-h-9 px-3 rounded-lg text-sm font-medium ${category === c ? 'bg-card text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>{c}</button>
            ))}
          </div>
        </div>
        <div role="radiogroup" aria-label="Topic" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <TopicCard selected={picked === 'random'} onClick={() => setPicked('random')} title="Surprise me" sub="A random topic, like a real GD" icon />
          {shown.map((t) => <TopicCard key={t.id} selected={picked === t.id} onClick={() => setPicked(t.id)} title={t.title} sub={t.category} />)}
          <TopicCard selected={picked === 'custom'} onClick={() => setPicked('custom')} title="My own topic" sub="Practise a topic you expect" />
        </div>
        {picked === 'custom' && (
          <input value={custom} onChange={(e) => setCustom(e.target.value)} maxLength={140} placeholder="e.g. Should internships be paid?" autoFocus
            className="w-full min-h-11 rounded-xl bg-raised border border-line-strong px-3 text-sm focus:outline-none focus:border-accent" />
        )}

        <div>
          <h3 className="text-sm font-semibold">Who starts?</h3>
          <div role="radiogroup" aria-label="Who starts" className="grid gap-2 sm:grid-cols-2 mt-2">
            {[
              [true, 'I\'ll open the discussion', 'Evaluators give credit for a clear opening. Recommended.'],
              [false, 'Let others start', 'Rohan and Meera begin, then you join in.'],
            ].map(([value, title, sub]) => (
              <button key={String(value)} type="button" role="radio" aria-checked={youStart === value} onClick={() => setYouStart(value as boolean)}
                className={`text-left rounded-xl border p-3.5 transition-colors ${youStart === value ? 'border-accent bg-accent-soft' : 'border-line hover:border-line-strong'}`}>
                <span className="block text-sm font-semibold">{title as string}</span>
                <span className="block text-xs text-muted mt-0.5">{sub as string}</span>
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-bad" role="alert">{error}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={start} disabled={starting || left <= 0} className="px-6">
            <Icon name="play" size={16} /> {starting ? 'Gathering your group…' : left <= 0 ? 'Daily limit reached' : 'Start the discussion'}
          </Button>
          <span className="text-xs text-muted">About 10 minutes · counts as one of today's interviews</span>
        </div>
      </Card>

      {criteria.length > 0 && (
        <Card>
          <h2 className="font-semibold">What GD evaluators look for</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4">
            {criteria.map((c) => (
              <li key={c.id} className="rounded-xl bg-raised p-3">
                <b className="text-sm">{c.label}</b>
                <p className="text-xs text-muted mt-0.5">{c.what.charAt(0).toUpperCase() + c.what.slice(1)}.</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {past && past.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display font-semibold text-2xl">Your discussions</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {past.map((g) => (
              <li key={g.id}>
                <Link to={`/gd/${g.id}`} className="h-full rounded-2xl bg-card border border-line p-4 flex items-center gap-4 transition-all">
                  <span className={`w-12 h-12 shrink-0 rounded-xl grid place-items-center font-bold tabular-nums ${g.score === null ? 'bg-raised text-muted' : g.score >= 70 ? 'bg-good-soft text-good' : g.score >= 40 ? 'bg-warn-soft text-warn' : 'bg-blush text-blush-ink'}`}>
                    {g.score ?? (g.status === 'in_progress' ? '…' : '-')}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold truncate">{g.topic}</span>
                    <span className="block text-xs text-muted">{g.status === 'in_progress' ? 'In progress' : new Date(g.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function TopicCard({ selected, onClick, title, sub, icon }: { selected: boolean; onClick: () => void; title: string; sub: string; icon?: boolean }) {
  return (
    <button type="button" role="radio" aria-checked={selected} onClick={onClick}
      className={`text-left rounded-xl border p-3.5 transition-all ${selected ? 'border-accent bg-accent-soft shadow-sm' : 'border-line hover:border-line-strong hover:bg-raised'}`}>
      <span className="flex items-center gap-1.5 text-sm font-semibold">{icon && <Icon name="bolt" size={14} className="text-accent" />}{title}</span>
      <span className="block text-xs text-muted mt-0.5">{sub}</span>
    </button>
  )
}

function Seat({ who, size = 'md', active = false, label }: { who: Who; size?: 'sm' | 'md'; active?: boolean; label?: string }) {
  const s = SEAT[who]
  const text = label ?? s.name
  return (
    <span className={`relative shrink-0 rounded-full grid place-items-center font-bold transition-all duration-300 ${s.tone} ${size === 'sm' ? 'w-10 h-10 text-sm' : 'w-14 h-14 sm:w-16 sm:h-16 text-lg'} ${active ? `ring-4 ${s.ring} ring-offset-2 ring-offset-card scale-110` : ''}`} aria-hidden="true">
      {active && <span className="absolute inset-0 rounded-full animate-ping opacity-25 bg-current motion-reduce:hidden" />}
      {who === 'moderator' ? <Icon name="mic" size={size === 'sm' ? 16 : 20} /> : text.slice(0, 1).toUpperCase()}
    </span>
  )
}

// ---------- The discussion room ----------
const VOICE_STYLE: Record<Exclude<Who, 'you'>, { gender: 'male' | 'female'; rate: number; pitch: number; second?: boolean }> = {
  moderator: { gender: 'female', rate: 1, pitch: 0.95, second: true },
  rohan: { gender: 'male', rate: 1.08, pitch: 0.92 },
  meera: { gender: 'female', rate: 1, pitch: 1.1 },
  kabir: { gender: 'male', rate: 1, pitch: 1.12, second: true },
}

export function GdRoom() {
  const { id } = useParams()
  const { me, refreshUsage } = useMe()
  const { confirm } = useFeedback()
  const [gd, setGd] = useState<Gd | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [shown, setShown] = useState(0) // messages revealed so far (new ones appear as they are "spoken")
  const [speaker, setSpeaker] = useState<Who | null>(null)
  const [busy, setBusy] = useState(false) // waiting for the classmates' reply
  const [typed, setTyped] = useState('')
  const [voiceOn, setVoiceOn] = useState(isSpeechSupported())
  const [recording, setRecording] = useState<Recording | null>(null)
  const [level, setLevel] = useState(0)
  const voices = useRef<Partial<Record<Who, SpeechSynthesisVoice | null>>>({})
  const alive = useRef(true)
  const voiceOnRef = useRef(voiceOn)
  const bottom = useRef<HTMLDivElement>(null)
  voiceOnRef.current = voiceOn

  const firstName = me?.full_name?.trim().split(/\s+/)[0] || 'You'

  // Pick a voice for each person, with different voices where the device has them
  useEffect(() => {
    alive.current = true
    void loadVoices().then((list) => {
      for (const [who, v] of Object.entries(VOICE_STYLE) as [Who, (typeof VOICE_STYLE)['rohan']][]) {
        const sameGender = list.filter((x) => voiceGender(x) === v.gender)
        voices.current[who] = (v.second && sameGender.length > 1 ? sameGender[1] : null) ?? pickVoice(list, v.gender)
      }
    })
    return () => { alive.current = false; stopSpeaking() }
  }, [])

  // Reveal (and speak) messages one by one
  const play = useCallback(async (messages: GdMessage[], from: number) => {
    for (let i = from; i < messages.length && alive.current; i++) {
      const m = messages[i]
      setShown(i + 1)
      if (m.who === 'you') continue
      setSpeaker(m.who)
      if (voiceOnRef.current) await speak(m.text, voices.current[m.who] ?? null, VOICE_STYLE[m.who].rate, VOICE_STYLE[m.who].pitch)
      else await new Promise((r) => setTimeout(r, 900))
    }
    if (alive.current) setSpeaker(null)
  }, [])

  useEffect(() => {
    apiFetch<Gd>(`/gd/${id}`).then((g) => {
      setGd(g)
      // A discussion that just started: play the opening. Opened later: show everything at once.
      const fresh = g.status === 'in_progress' && g.student_turns === 0 && Date.now() - Date.parse(g.created_at) < 3 * 60_000
      if (fresh) void play(g.messages, 0)
      else setShown(g.messages.length)
    }).catch((e) => setError(e.message))
  }, [id, play])

  // Keep the newest message in view
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [shown, busy])

  // While the report is being written, check every 3 seconds
  useEffect(() => {
    if (!gd || gd.status === 'in_progress' || gd.report_status !== 'generating') return
    const t = setTimeout(() => apiFetch<Gd>(`/gd/${gd.id}`).then(setGd).catch(() => {}), 3000)
    return () => clearTimeout(t)
  }, [gd])

  async function send(turn: { text: string } | { pass: true } | { audio: Blob }) {
    if (!gd) return
    setError(null)
    setBusy(true)
    stopSpeaking()
    const before = gd.messages.length
    // Show the student's own words straight away (spoken turns appear once transcribed)
    if ('text' in turn) {
      setGd({ ...gd, messages: [...gd.messages, { who: 'you', text: turn.text }] })
      setShown(before + 1)
    }
    try {
      const next = 'audio' in turn
        ? await apiFetch<Gd>(`/gd/${gd.id}/turn-audio`, { method: 'POST', body: turn.audio })
        : await apiFetch<Gd>(`/gd/${gd.id}/turn`, { method: 'POST', body: JSON.stringify(turn) })
      setTyped('')
      setGd(next)
      setBusy(false)
      if (next.status !== 'in_progress') refreshUsage()
      await play(next.messages, before)
    } catch (err) {
      setGd(gd)
      setShown(before)
      setError((err as Error).message)
      setBusy(false)
    }
  }

  async function toggleMic() {
    if (recording) {
      const rec = recording
      setRecording(null)
      setLevel(0)
      const audio = await rec.stop()
      await send({ audio })
      return
    }
    try {
      stopSpeaking()
      setRecording(await startRecording({ onLevel: setLevel, onSpeech: () => {}, silenceSeconds: 0, onSilence: () => {} }))
    } catch {
      setError('We couldn\'t use your microphone. Allow microphone access, or type your point instead.')
    }
  }

  async function end() {
    if (!gd) return
    if (!(await confirm({ title: 'End the discussion now?', body: 'You will get feedback on what you said so far.', confirmLabel: 'End discussion' }))) return
    stopSpeaking()
    recording?.cancel()
    setRecording(null)
    const next = await apiFetch<Gd>(`/gd/${gd.id}/end`, { method: 'POST' }).catch((e) => { setError(e.message); return null })
    if (next) { setGd(next); setShown(next.messages.length); setSpeaker(null) }
  }

  if (error && !gd) return <EmptyState title="Discussion not found" body={error} action={<Link to="/gd" className="text-accent-deep font-semibold">Group discussion</Link>} />
  if (!gd) return <ListSkeleton label="Joining the discussion" />

  const live = gd.status === 'in_progress'
  const waiting = busy || speaker !== null || shown < gd.messages.length
  const summaryTurn = gd.phase === 'summary'
  const visible = gd.messages.slice(0, shown)

  return (
    <div className="space-y-5 pb-40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to="/gd" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><Icon name="arrow" size={15} className="rotate-180" /> Group discussion</Link>
          <p className="text-xs font-semibold text-peach-ink mt-3">{gd.category || 'Topic'}</p>
          <h1 className="font-display font-semibold text-3xl sm:text-4xl leading-tight">{gd.topic}</h1>
        </div>
        {live && (
          <div className="flex items-center gap-2">
            {isSpeechSupported() && (
              <button type="button" onClick={() => { setVoiceOn(!voiceOn); if (voiceOn) stopSpeaking() }} aria-pressed={voiceOn}
                className="min-h-10 px-3 rounded-xl border border-line-strong bg-card text-sm inline-flex items-center gap-1.5 hover:bg-raised">
                <Icon name="volume" size={16} /> {voiceOn ? 'Voices on' : 'Voices off'}
              </button>
            )}
            <button type="button" onClick={end} className="min-h-10 px-3 rounded-xl border border-line-strong bg-card text-sm hover:border-bad hover:text-bad">End</button>
          </div>
        )}
      </div>

      {/* The table */}
      <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
        <div className="flex items-center justify-around gap-2">
          {[...CLASSMATES, 'you' as Who].map((w) => (
            <div key={w} className="flex flex-col items-center gap-1.5 min-w-0">
              <Seat who={w} active={speaker === w || (w === 'you' && !!recording)} label={w === 'you' ? firstName : undefined} />
              <span className={`text-xs truncate max-w-20 ${speaker === w ? 'font-semibold text-ink' : 'text-muted'}`}>{w === 'you' ? firstName : SEAT[w].name}</span>
            </div>
          ))}
        </div>
        {live && (
          <div className="mt-4 flex items-center justify-center gap-1.5" aria-label={`Your turn ${Math.min(gd.student_turns + 1, gd.turnsTotal)} of ${gd.turnsTotal}${summaryTurn ? ', then the summary' : ''}`}>
            {Array.from({ length: gd.turnsTotal + 1 }, (_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i < gd.student_turns ? 'w-6 bg-accent' : i === gd.student_turns ? 'w-6 bg-accent/40' : 'w-3 bg-hover'} ${i === gd.turnsTotal ? 'ml-1' : ''}`} />
            ))}
            <span className="text-xs text-muted ml-2">{summaryTurn ? 'Summary' : `Turn ${Math.min(gd.student_turns + 1, gd.turnsTotal)} of ${gd.turnsTotal}`}</span>
          </div>
        )}
      </section>

      {!live && <GdResult gd={gd} />}

      {/* Transcript */}
      <section aria-label="Discussion" aria-live="polite" className="space-y-3">
        {!live && <h2 className="font-display font-semibold text-2xl pt-2">The discussion</h2>}
        {visible.map((m, i) => m.who === 'moderator' ? (
          <p key={i} className="mx-auto max-w-xl text-center text-sm text-soft bg-raised rounded-xl px-4 py-2.5"><b className="text-ink">Moderator:</b> {m.text}</p>
        ) : (
          <div key={i} className={`flex gap-3 items-end ${m.who === 'you' ? 'flex-row-reverse' : ''} animate-[pop-in_0.35s_ease-out_both] motion-reduce:animate-none`}>
            <Seat who={m.who} size="sm" label={m.who === 'you' ? firstName : undefined} />
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${SEAT[m.who].bubble} ${m.who === 'you' ? 'rounded-br-md' : 'rounded-bl-md'}`}>
              <p className="text-xs font-semibold text-muted">{m.who === 'you' ? firstName : SEAT[m.who].name}</p>
              <p className={`text-sm leading-relaxed mt-0.5 ${m.pass ? 'italic text-muted' : 'text-ink'}`}>{m.pass ? 'Stayed quiet this turn' : m.text}</p>
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex gap-3 items-center text-sm text-muted">
            <span className="flex gap-1" aria-hidden="true">{[0, 1, 2].map((d) => <span key={d} className="w-2 h-2 rounded-full bg-muted animate-bounce" style={{ animationDelay: `${d * 120}ms` }} />)}</span>
            Your classmates are thinking…
          </div>
        )}
        {/* scroll-margin keeps the newest message above the "Your turn" box */}
        <div ref={bottom} className="scroll-mb-56" />
      </section>

      {/* Your turn */}
      {live && (
        <div className="fixed inset-x-0 bottom-[calc(4.6rem+env(safe-area-inset-bottom))] lg:bottom-0 lg:left-62 z-20 px-4 pb-3 lg:pb-5 pointer-events-none">
          <div className="max-w-3xl mx-auto rounded-2xl border border-line bg-card/95 backdrop-blur shadow-xl p-3 sm:p-4 space-y-2.5 pointer-events-auto">
            <p className="text-xs font-semibold text-muted flex items-center gap-2">
              {waiting ? <><span className="w-2 h-2 rounded-full bg-warn animate-pulse" /> {busy ? 'Waiting for the group…' : `${speaker ? SEAT[speaker].name : 'Someone'} is speaking…`}</>
                : summaryTurn ? <><span className="w-2 h-2 rounded-full bg-good" /> The moderator asked for a summary. Conclude in 3 or 4 sentences, naming the main points.</>
                  : <><span className="w-2 h-2 rounded-full bg-good" /> Your turn. Agree and add, disagree with a reason, or bring the group back on track.</>}
            </p>
            <div className="flex items-end gap-2">
              {isRecordingSupported() && (
                <button type="button" onClick={toggleMic} disabled={busy || (waiting && !recording)} aria-label={recording ? 'Stop and send' : 'Speak your point'}
                  className={`relative shrink-0 w-12 h-12 rounded-full grid place-items-center transition-colors disabled:opacity-50 ${recording ? 'bg-bad text-white' : 'bg-accent text-on-accent hover:bg-accent-hover'}`}>
                  {recording && <span className="absolute inset-0 rounded-full bg-bad/40" style={{ transform: `scale(${1 + level * 0.6})` }} />}
                  <span className="relative">{recording ? <span className="block w-4 h-4 rounded-sm bg-white" /> : <Icon name="mic" size={20} />}</span>
                </button>
              )}
              <label htmlFor="gd-point" className="sr-only">Your point</label>
              <textarea id="gd-point" value={typed} onChange={(e) => setTyped(e.target.value)} rows={1} maxLength={1500} disabled={busy || !!recording}
                placeholder={recording ? 'Listening… tap the red button to send' : summaryTurn ? 'Type your summary…' : 'Or type your point…'}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && typed.trim().length >= 2 && !waiting) { e.preventDefault(); void send({ text: typed.trim() }) } }}
                className="flex-1 min-h-12 max-h-32 rounded-xl bg-raised border border-line-strong px-3 py-3 text-sm resize-none focus:outline-none focus:border-accent" />
              <Button onClick={() => send({ text: typed.trim() })} disabled={waiting || typed.trim().length < 2} className="shrink-0 min-h-12">Send</Button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button type="button" onClick={() => send({ pass: true })} disabled={waiting || !!recording} className="text-xs text-muted hover:text-ink disabled:opacity-50">
                {summaryTurn ? 'Let someone else summarise' : 'Stay quiet this turn'}
              </button>
              {error && <p className="text-xs text-bad" role="alert">{error}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------- The report ----------
const LABELS: Record<string, string> = { initiation: 'Initiation', content: 'Content', communication: 'Communication', listening: 'Listening', leadership: 'Leadership', conclusion: 'Summary' }

function GdResult({ gd }: { gd: Gd }) {
  const { me } = useMe()
  const navigate = useNavigate()
  const hideScores = me?.practice_without_score ?? false

  if (gd.report_status === 'none') {
    return <Card className="text-center py-8"><p className="font-semibold">The discussion ended before you spoke</p><p className="text-sm text-muted mt-1">Start another one and jump in early.</p><Button className="mt-4" onClick={() => navigate('/gd')}>Try another topic</Button></Card>
  }
  if (gd.report_status === 'generating' || !gd.report) {
    return gd.report_status === 'failed' ? (
      <Card className="text-center py-8">
        <p className="font-semibold">We couldn't prepare your feedback this time.</p>
        <Button className="mt-4" onClick={() => apiFetch(`/gd/${gd.id}/report/retry`, { method: 'POST' }).then(() => window.location.reload())}>Try again</Button>
      </Card>
    ) : (
      <Card className="text-center py-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft text-accent-deep px-3 py-1 text-xs font-semibold"><span className="w-2 h-2 rounded-full bg-accent animate-pulse" /> Evaluating</span>
        <p className="font-semibold mt-3">Your GD evaluator is writing feedback…</p>
        <p className="text-sm text-muted mt-1">This usually takes under a minute.</p>
      </Card>
    )
  }

  const r = gd.report
  const f = r.facts
  const turns: InterviewTurn[] = gd.messages.filter((m) => m.who === 'you' && !m.pass)
    .map((m, i) => ({ seq: i + 1, round: 'behavioural', question: '', is_follow_up: false, answer: m.text, skipped: false, speech: m.speech ?? null }))

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-line bg-card p-6 flex flex-col sm:flex-row gap-6 items-center">
        {!hideScores && <div className="bg-card/80 rounded-full p-1 shadow-sm"><ScoreRing value={r.overall} label="out of 100" suffix="" size={120} /></div>}
        <div className="flex-1">
          <p className="text-xs font-semibold text-lavender-ink">GD feedback</p>
          <p className="text-ink mt-2 leading-relaxed">{r.summary}</p>
          <ul className="flex flex-wrap gap-2 mt-4">
            {[
              [f.opened, f.opened ? 'Opened the discussion' : 'Didn\'t open'],
              [f.spokeTurns >= 4, `Spoke ${f.spokeTurns} time${f.spokeTurns === 1 ? '' : 's'}`],
              [f.namesMentioned >= 2, `Named others ${f.namesMentioned}×`],
              [f.summarised, f.summarised ? 'Gave the summary' : 'No summary'],
            ].map(([ok, text]) => (
              <li key={text as string} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${ok ? 'bg-good-soft text-good' : 'bg-card/80 text-soft'}`}>
                <Icon name={ok ? 'check' : 'alert'} size={13} /> {text as string}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {r.criteria.map((c) => (
          <Card key={c.id} className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <b className="text-sm">{LABELS[c.id] ?? c.id}</b>
              {!hideScores && <span className="text-sm font-bold tabular-nums">{c.score}/10</span>}
            </div>
            {!hideScores && <div className="h-2 rounded-full bg-hover overflow-hidden"><div className={`h-full rounded-full ${c.score >= 7 ? 'bg-good' : c.score >= 4 ? 'bg-warn' : 'bg-bad'}`} style={{ width: `${c.score * 10}%` }} /></div>}
            <p className="text-sm text-soft">{c.note}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-t-4 border-t-good">
          <h3 className="font-display font-semibold text-2xl flex items-center gap-2"><Icon name="check" size={18} className="text-good" /> What went well</h3>
          <ul className="mt-3 space-y-2 text-sm text-soft">{r.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
        </Card>
        <Card className="border-t-4 border-t-warn">
          <h3 className="font-display font-semibold text-2xl flex items-center gap-2"><Icon name="target" size={18} className="text-warn" /> What to work on</h3>
          <ul className="mt-3 space-y-2 text-sm text-soft">{r.improvements.map((s) => <li key={s}>{s}</li>)}</ul>
        </Card>
      </div>

      {r.betterPoints.length > 0 && (
        <Card>
          <h3 className="font-semibold flex items-center gap-2"><Icon name="bolt" size={16} className="text-accent" /> Points you could have made</h3>
          <ul className="mt-3 space-y-3">
            {r.betterPoints.map((b) => <li key={b.point} className="rounded-xl bg-accent-soft p-3 text-sm"><b className="text-ink">{b.point}</b>{b.why && <span className="block text-soft mt-1">{b.why}</span>}</li>)}
          </ul>
        </Card>
      )}

      <SpeakingCoach turns={turns} />

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => navigate('/gd')}><Icon name="play" size={16} /> Try another topic</Button>
      </div>
      <p className="text-xs text-muted">Practice feedback written by AI against common GD evaluation criteria. It is not a real selection decision.</p>
    </div>
  )
}
