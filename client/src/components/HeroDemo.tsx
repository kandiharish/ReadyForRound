import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { apiFetch } from '../lib/api'
import { loadVoices, pickVoice, speak, stopSpeaking } from '../lib/speech'
import { Avatar, type AvatarState } from './Avatar'
import { Icon } from './ui'
import { VoiceHint } from './VoiceHint'

// The landing page's hero: a real one-question interview anyone can try without signing up.
// Pick your role, hear Priya ask, answer out loud (or type), and get a real score with one strength and one fix.
// Until someone interacts it plays a gentle preview: the question types itself and an example score appears.

// Keep ids and questions in sync with QUESTIONS in server/src/routes/demo.ts
const DEMO_QUESTIONS = [
  { id: 'frontend', chip: 'Frontend', round: 'Technical round', question: 'What happens in the browser between typing a website address and seeing the page?', example: { score: 74, good: 'Clear order: DNS, request, then rendering', improve: 'Mention caching and how the DOM is built' } },
  { id: 'data', chip: 'Data Analyst', round: 'Technical round', question: 'When would you use a LEFT JOIN instead of an INNER JOIN?', example: { score: 72, good: 'Clear example with tables', improve: 'Next: GROUP BY with HAVING' } },
  { id: 'vlsi', chip: 'VLSI', round: 'Core technical', question: 'What is the difference between setup time and hold time?', example: { score: 68, good: 'Correct definitions of both', improve: 'Explain what happens when each is violated' } },
  { id: 'hr', chip: 'HR round', round: 'HR round', question: 'Tell me about a time you worked in a team under pressure.', example: { score: 81, good: 'Great STAR structure', improve: 'Say what YOU did, not "we"' } },
  { id: 'experienced', chip: 'Experienced', round: 'Switching jobs', question: 'Why are you looking to move on from your current role?', example: { score: 77, good: 'Positive, forward-looking reason', improve: 'Link it to what this role offers you' } },
] as const

type Q = (typeof DEMO_QUESTIONS)[number]
type Phase = 'idle' | 'speaking' | 'recording' | 'typing' | 'scoring' | 'result'
type Result = { score: number; good: string; improve: string; transcript: string }

const MAX_SECONDS = 30
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Browsers that can show live captions while you speak (Chrome, Edge); others show a sound meter instead
type Recognition = { lang: string; interimResults: boolean; continuous: boolean; start(): void; stop(): void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null }
const RecognitionCtor = (window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }).SpeechRecognition
  ?? (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition

export function HeroDemo() {
  const [q, setQ] = useState<Q>(DEMO_QUESTIONS[0])
  const [touched, setTouched] = useState(false) // stops the automatic preview once someone interacts
  const [typed, setTyped] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [seconds, setSeconds] = useState(0)
  const [caption, setCaption] = useState('')
  const [level, setLevel] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [text, setText] = useState('')
  const rec = useRef<{ recorder: MediaRecorder; stream: MediaStream; chunks: Blob[]; ctx?: AudioContext; recog?: Recognition; timer?: number; raf?: number } | null>(null)

  // The question types itself out whenever it changes
  useEffect(() => {
    setTyped(reduced() ? q.question.length : 0)
    if (reduced()) return
    const t = setInterval(() => setTyped((n) => (n >= q.question.length ? (clearInterval(t), n) : n + 1)), 24)
    return () => clearInterval(t)
  }, [q])

  // Preview: until someone interacts, move to the next role every few seconds
  useEffect(() => {
    if (touched || reduced()) return
    const t = setTimeout(() => setQ((cur) => DEMO_QUESTIONS[(DEMO_QUESTIONS.indexOf(cur) + 1) % DEMO_QUESTIONS.length]), 7500)
    return () => clearTimeout(t)
  }, [q, touched])

  const cleanup = useCallback(() => {
    const r = rec.current
    if (!r) return
    if (r.timer) clearInterval(r.timer)
    if (r.raf) cancelAnimationFrame(r.raf)
    r.recog?.stop()
    r.stream.getTracks().forEach((t) => t.stop())
    r.ctx?.close().catch(() => {})
    rec.current = null
  }, [])
  useEffect(() => () => { cleanup(); stopSpeaking() }, [cleanup])

  function choose(next: Q) {
    if (phase === 'recording' || phase === 'scoring') return
    stopSpeaking()
    setTouched(true); setQ(next); setPhase('idle'); setResult(null); setError(null); setText('')
  }

  async function hear() {
    setTouched(true); setError(null)
    setPhase('speaking')
    try {
      const voice = pickVoice(await loadVoices(), 'female')
      await speak(q.question, voice)
    } finally {
      setPhase((p) => (p === 'speaking' ? 'idle' : p))
    }
  }

  async function startRecording() {
    setTouched(true); setError(null); setResult(null); setCaption(''); stopSpeaking()
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setError('Microphone not available. You can type your answer instead.')
      setPhase('typing')
      return
    }
    const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((t) => MediaRecorder.isTypeSupported?.(t))
    const recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined)
    const chunks: Blob[] = []
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
    recorder.onstop = () => send(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }))
    rec.current = { recorder, stream, chunks }

    // A live sound meter from the microphone level
    try {
      const ctx = new AudioContext()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      ctx.createMediaStreamSource(stream).connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteTimeDomainData(data)
        let peak = 0
        for (const v of data) peak = Math.max(peak, Math.abs(v - 128))
        setLevel(Math.min(1, peak / 64))
        if (rec.current) rec.current.raf = requestAnimationFrame(tick)
      }
      rec.current.ctx = ctx
      rec.current.raf = requestAnimationFrame(tick)
    } catch { /* the meter is a nice-to-have */ }

    // Live captions where the browser supports them (the score uses the server's more accurate transcript)
    if (RecognitionCtor) {
      try {
        const recog = new RecognitionCtor()
        recog.lang = 'en-IN'; recog.interimResults = true; recog.continuous = true
        recog.onresult = (e) => setCaption(Array.from(e.results).map((r) => r[0].transcript).join(' '))
        recog.start()
        rec.current.recog = recog
      } catch { /* captions are a nice-to-have */ }
    }

    recorder.start()
    setSeconds(0)
    setPhase('recording')
    rec.current.timer = window.setInterval(() => setSeconds((s) => {
      if (s + 1 >= MAX_SECONDS) stopRecording()
      return s + 1
    }), 1000)
  }

  function stopRecording() {
    const r = rec.current
    if (!r || r.recorder.state === 'inactive') return
    setPhase('scoring')
    r.recorder.stop()
    cleanup()
  }

  async function send(audio: Blob) {
    try {
      const res = await apiFetch<Result>(`/demo/answer-audio?q=${q.id}`, { method: 'POST', body: audio })
      setResult(res); setPhase('result')
    } catch (e) {
      setError((e as Error).message); setPhase('idle')
    }
  }

  async function sendText() {
    if (!text.trim()) return
    setPhase('scoring'); setError(null)
    try {
      const res = await apiFetch<Result>('/demo/answer-text', { method: 'POST', body: JSON.stringify({ q: q.id, text }) })
      setResult(res); setPhase('result')
    } catch (e) {
      setError((e as Error).message); setPhase('typing')
    }
  }

  const avatar: AvatarState = phase === 'speaking' ? 'speaking' : phase === 'recording' ? 'listening' : phase === 'scoring' ? 'thinking' : 'idle'
  const scoreTone = (s: number) => (s >= 70 ? 'text-good' : s >= 40 ? 'text-warn' : 'text-bad')
  const showExample = !touched && typed >= q.question.length

  return (
    <div className="relative mx-auto w-full max-w-lg xl:max-w-xl" aria-label="Try one interview question">
      {/* Pick your role: the question changes to match */}
      <div role="radiogroup" aria-label="Your role" className="flex flex-wrap justify-center gap-1.5 mb-4">
        {DEMO_QUESTIONS.map((x) => (
          <button key={x.id} type="button" role="radio" aria-checked={q.id === x.id} onClick={() => choose(x)}
            className={`min-h-8 px-3 rounded-full text-xs font-medium border transition-colors ${q.id === x.id ? 'bg-ink text-paper border-ink' : 'bg-card text-soft border-line-strong hover:border-ink/40'}`}>
            {x.chip}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-stage-card border border-stage-line shadow-[0_30px_70px_-30px_rgba(16,24,40,0.35)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-stage-line text-xs text-stage-muted">
          <span className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${phase === 'recording' ? 'bg-bad animate-pulse' : 'bg-good'}`} /> {q.round}</span>
          <span>Try it free · no sign-up</span>
        </div>

        <div className="bg-stage px-5 sm:px-6 pt-6 pb-5 flex flex-col items-center">
          <div className={`w-28 h-28 rounded-full overflow-hidden transition-shadow duration-500 ${phase === 'speaking' ? 'shadow-[0_0_0_5px_rgba(var(--glow-rgb),0.35),0_0_50px_rgba(var(--glow-rgb),0.3)]' : 'shadow-[0_0_0_3px_rgba(var(--glow-rgb),0.12)]'}`}>
            <Avatar who="priya" state={avatar} />
          </div>

          <div className="mt-4 w-full min-h-24 rounded-xl bg-stage-card border border-stage-line px-4 py-3">
            <p className="text-xs text-accent-deep font-medium">Priya asks</p>
            <p className="font-display text-lg leading-snug text-stage-text mt-0.5">
              {q.question.slice(0, typed)}
              {typed < q.question.length && <span className="inline-block w-0.5 h-4 bg-accent align-middle ml-0.5 animate-[caret_1s_steps(1)_infinite]" />}
            </p>
          </div>

          {/* What the visitor can do next */}
          <div className="mt-4 w-full">
            {phase === 'recording' ? (
              <div className="rounded-xl border border-bad/30 bg-card p-3">
                <div className="flex items-center gap-3">
                  <span className="flex items-end gap-0.5 h-6 w-16" aria-hidden="true">
                    {[0.5, 0.8, 1, 0.7, 0.9, 0.6, 0.85].map((f, i) => (
                      <span key={i} className="flex-1 rounded-full bg-bad transition-[height] duration-100" style={{ height: `${Math.max(12, level * f * 100)}%` }} />
                    ))}
                  </span>
                  <span className="flex-1 text-sm text-soft tabular-nums">Listening… 0:{String(seconds).padStart(2, '0')} / 0:30</span>
                  <button type="button" onClick={stopRecording} className="min-h-9 px-4 rounded-lg bg-bad text-white text-sm font-semibold hover:opacity-90">Done</button>
                </div>
                <p className="mt-2 text-sm text-stage-text min-h-5 line-clamp-2" aria-live="polite">{caption || <span className="text-stage-muted">Speak your answer…</span>}</p>
              </div>
            ) : phase === 'typing' ? (
              <div className="space-y-2">
                <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={2000} autoFocus aria-label="Your answer"
                  placeholder="Type your answer as you would say it…" className="w-full rounded-xl border border-line-strong bg-card px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent" />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => { setPhase('idle'); setError(null) }} className="min-h-9 px-3 rounded-lg text-sm text-soft hover:bg-raised">Cancel</button>
                  <button type="button" onClick={sendText} disabled={!text.trim()} className="min-h-9 px-4 rounded-lg bg-accent text-on-accent text-sm font-semibold disabled:opacity-40">Score my answer</button>
                </div>
              </div>
            ) : phase === 'scoring' ? (
              <div className="flex items-center justify-center gap-2 min-h-11 text-sm text-soft" role="status">
                <span className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" /> Listening back and scoring your answer…
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button type="button" onClick={hear} disabled={phase === 'speaking'}
                  className="inline-flex items-center gap-2 min-h-10 px-4 rounded-full border border-line-strong bg-card text-sm font-medium text-ink hover:bg-raised disabled:opacity-60">
                  <Icon name="volume" size={15} /> {phase === 'speaking' ? 'Priya is asking…' : 'Hear the question'}
                </button>
                <button type="button" onClick={startRecording}
                  className="inline-flex items-center gap-2 min-h-10 px-4 rounded-full bg-accent text-on-accent text-sm font-semibold hover:bg-accent-hover">
                  <Icon name="mic" size={15} /> {result ? 'Try again' : 'Answer out loud'}
                </button>
                <button type="button" onClick={() => { setTouched(true); setPhase('typing'); setError(null) }} className="min-h-10 px-2 text-sm text-muted hover:text-ink underline-offset-2 hover:underline">or type</button>
              </div>
            )}
            {error && <p className="mt-2 text-sm text-center text-warn" role="alert">{error}</p>}
          </div>
        </div>

        {/* A real result, or (before anyone tries) a clearly labelled example */}
        {(phase === 'result' && result) || showExample ? (
          <div key={result ? 'r' : q.id} className="border-t border-stage-line bg-card px-5 py-4 motion-safe:animate-[toast-in_0.4s_cubic-bezier(0.22,1,0.36,1)]">
            {(() => {
              const r = result ?? { ...q.example, transcript: '' }
              return (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted">{result ? 'Your feedback' : 'Example feedback'}</span>
                    {result && <span className="text-xs text-muted">Free demo · 1 question</span>}
                  </div>
                  <div className="mt-1 grid grid-cols-[auto_1fr] gap-x-4 items-center">
                    <span className={`font-display font-semibold text-4xl tabular-nums ${scoreTone(r.score)}`}>{r.score}<span className="text-sm text-muted font-normal"> / 100</span></span>
                    <div className="space-y-1.5 text-xs">
                      <p className="rounded-md bg-good-soft text-good px-2 py-1.5">✓ {r.good}</p>
                      <p className="rounded-md bg-raised text-soft px-2 py-1.5">→ {r.improve}</p>
                    </div>
                  </div>
                  {result && (
                    <>
                      <details className="mt-3 text-xs text-muted">
                        <summary className="cursor-pointer hover:text-ink">What we heard</summary>
                        <p className="mt-1.5 text-soft leading-relaxed">{result.transcript}</p>
                      </details>
                      <Link to="/signup" className="mt-3 flex items-center justify-center gap-2 min-h-10 rounded-lg bg-ink text-paper text-sm font-semibold hover:opacity-90">
                        Get a full interview with a detailed report <Icon name="arrow" size={15} />
                      </Link>
                    </>
                  )}
                </>
              )
            })()}
          </div>
        ) : null}
      </div>
      <p className="mt-3 text-center text-xs text-muted">Your recording is turned into text for scoring, then deleted.</p>
      {touched && <VoiceHint className="mt-1 text-center" />}
    </div>
  )
}
