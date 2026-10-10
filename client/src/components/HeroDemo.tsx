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
  // The laptop leans a few degrees towards the pointer
  const stage = useRef<HTMLDivElement>(null)
  const [tiltXY, setTiltXY] = useState<[number, number]>([0, 0])
  function lean(e: React.PointerEvent) {
    if (reduced() || e.pointerType !== 'mouse' || !stage.current) return
    const r = stage.current.getBoundingClientRect()
    setTiltXY([((e.clientX - r.left) / r.width - 0.5) * 8, -((e.clientY - r.top) / r.height - 0.5) * 6])
  }
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
  const feedback = phase === 'result' && result ? result : showExample ? { ...q.example, transcript: '' } : null

  return (
    <div className="relative mx-auto w-full max-w-xl 2xl:max-w-2xl" aria-label="Try one interview question">
      {/* Pick your role: the question changes to match */}
      <div role="radiogroup" aria-label="Your role" className="relative z-10 flex flex-wrap justify-center gap-1.5 mb-6">
        {DEMO_QUESTIONS.map((x) => (
          <button key={x.id} type="button" role="radio" aria-checked={q.id === x.id} onClick={() => choose(x)}
            className={`min-h-8 px-3 rounded-full text-xs font-medium border transition-colors ${q.id === x.id ? 'bg-ink text-paper border-ink' : 'bg-card/90 backdrop-blur text-soft border-line-strong hover:border-ink/40'}`}>
            {x.chip}
          </button>
        ))}
      </div>

      {/* The laptop: the lid opens on arrival, then it floats and leans gently towards the pointer */}
      <div ref={stage} onPointerMove={lean} onPointerLeave={() => setTiltXY([0, 0])} className="relative [perspective:1600px]">
        <div className="relative transition-transform duration-500 ease-out motion-safe:animate-[laptop-float_7s_ease-in-out_infinite] [transform-style:preserve-3d]"
          style={{ transform: `rotateX(${4 + tiltXY[1]}deg) rotateY(${-8 + tiltXY[0]}deg)` }}>
          {/* Lid */}
          <div className="relative origin-bottom motion-safe:animate-[lid-open_1.1s_cubic-bezier(0.22,1,0.36,1)_0.25s_both] [transform-style:preserve-3d]">
            <div className="rounded-t-[18px] rounded-b-md bg-[#0d1117] p-2.5 pb-3 shadow-[0_40px_80px_-30px_rgba(16,24,40,0.55)] ring-1 ring-black/40">
              <span aria-hidden="true" className="block mx-auto mb-1.5 w-1.5 h-1.5 rounded-full bg-[#2a2f38] ring-1 ring-white/5" />
              {/* Screen */}
              <div className="@container relative overflow-hidden rounded-md bg-stage text-stage-text">
                <div className="flex items-center justify-between px-3 h-7 border-b border-stage-line bg-stage-card text-[11px] text-stage-muted">
                  <span className="flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${phase === 'recording' ? 'bg-bad animate-pulse' : 'bg-good'}`} /> {q.round}</span>
                  <span>Try it free · no sign-up</span>
                </div>

                <div className="flex flex-col @md:flex-row gap-3 p-3 @md:min-h-[17.5rem]">
                  {/* Priya's video tile */}
                  <div className="relative @md:w-[42%] shrink-0 rounded-lg overflow-hidden bg-stage-raised border border-stage-line aspect-[4/3] @md:aspect-auto">
                    <div className="absolute inset-0 grid place-items-center">
                      <div className={`w-24 h-24 @md:w-28 @md:h-28 rounded-full overflow-hidden transition-shadow duration-500 ${phase === 'speaking' ? 'shadow-[0_0_0_4px_rgba(var(--glow-rgb),0.35),0_0_40px_rgba(var(--glow-rgb),0.35)]' : 'shadow-[0_0_0_2px_rgba(var(--glow-rgb),0.15)]'}`}>
                        <Avatar who="priya" state={avatar} />
                      </div>
                    </div>
                    <span className="absolute left-2 bottom-2 rounded bg-black/55 text-white text-[10px] px-1.5 py-0.5">Priya · Interviewer</span>
                  </div>

                  {/* Question and controls */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <p className="text-[11px] text-accent-deep font-medium">Priya asks</p>
                    <p className="font-display text-[15px] @md:text-base leading-snug mt-0.5 min-h-[3.2em]">
                      {q.question.slice(0, typed)}
                      {typed < q.question.length && <span className="inline-block w-0.5 h-3.5 bg-accent align-middle ml-0.5 animate-[caret_1s_steps(1)_infinite]" />}
                    </p>
                    <div className="flex-1 min-h-3" />

                    {phase === 'recording' ? (
                      <div className="rounded-lg border border-bad/30 bg-stage-card p-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex items-end gap-0.5 h-5 w-12" aria-hidden="true">
                            {[0.5, 0.8, 1, 0.7, 0.9, 0.6].map((f, i) => (
                              <span key={i} className="flex-1 rounded-full bg-bad transition-[height] duration-100" style={{ height: `${Math.max(14, level * f * 100)}%` }} />
                            ))}
                          </span>
                          <span className="flex-1 text-xs text-stage-soft tabular-nums">0:{String(seconds).padStart(2, '0')} / 0:30</span>
                          <button type="button" onClick={stopRecording} className="min-h-8 px-3 rounded-md bg-bad text-white text-xs font-semibold hover:opacity-90">Done</button>
                        </div>
                        <p className="mt-1.5 text-xs min-h-4 line-clamp-2" aria-live="polite">{caption || <span className="text-stage-muted">Speak your answer…</span>}</p>
                      </div>
                    ) : phase === 'typing' ? (
                      <div className="space-y-1.5">
                        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={2000} autoFocus aria-label="Your answer"
                          placeholder="Type your answer as you would say it…" className="w-full rounded-md border border-line-strong bg-card px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-accent" />
                        <div className="flex justify-end gap-1.5">
                          <button type="button" onClick={() => { setPhase('idle'); setError(null) }} className="min-h-8 px-2.5 rounded-md text-xs text-stage-soft hover:bg-stage-raised">Cancel</button>
                          <button type="button" onClick={sendText} disabled={!text.trim()} className="min-h-8 px-3 rounded-md bg-accent text-on-accent text-xs font-semibold disabled:opacity-40">Score my answer</button>
                        </div>
                      </div>
                    ) : phase === 'scoring' ? (
                      <div className="flex items-center gap-2 min-h-9 text-xs text-stage-soft" role="status">
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-accent border-t-transparent animate-spin" /> Listening back and scoring…
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button type="button" onClick={startRecording}
                          className="inline-flex items-center gap-1.5 min-h-9 px-3.5 rounded-full bg-accent text-on-accent text-xs font-semibold hover:bg-accent-hover">
                          <Icon name="mic" size={13} /> {result ? 'Try again' : 'Answer out loud'}
                        </button>
                        <button type="button" onClick={hear} disabled={phase === 'speaking'}
                          className="inline-flex items-center gap-1.5 min-h-9 px-3 rounded-full border border-stage-line bg-stage-card text-xs font-medium hover:bg-stage-raised disabled:opacity-60">
                          <Icon name="volume" size={13} /> {phase === 'speaking' ? 'Asking…' : 'Hear it'}
                        </button>
                        <button type="button" onClick={() => { setTouched(true); setPhase('typing'); setError(null) }} className="min-h-9 px-1.5 text-xs text-stage-muted hover:text-stage-text hover:underline underline-offset-2">or type</button>
                      </div>
                    )}
                    {error && <p className="mt-1.5 text-xs text-warn" role="alert">{error}</p>}
                  </div>
                </div>

                {/* Feedback slides up from the bottom of the screen: a real result, or a labelled example */}
                {feedback && (
                  <div key={result ? 'r' : q.id} className="border-t border-stage-line bg-card px-3 py-2.5 motion-safe:animate-[sheet-up_0.45s_cubic-bezier(0.22,1,0.36,1)]">
                    <div className="flex items-center gap-3">
                      <span className={`font-display font-semibold text-3xl tabular-nums leading-none ${scoreTone(feedback.score)}`}>{feedback.score}<span className="text-[11px] text-muted font-normal">/100</span></span>
                      <div className="flex-1 min-w-0 space-y-1 text-[11px]">
                        <p className="rounded bg-good-soft text-good px-1.5 py-1 truncate">✓ {feedback.good}</p>
                        <p className="rounded bg-raised text-soft px-1.5 py-1 truncate">→ {feedback.improve}</p>
                      </div>
                      <span className="self-start text-[10px] text-muted">{result ? 'Your score' : 'Example'}</span>
                    </div>
                    {result && (
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <details className="text-[11px] text-muted min-w-0">
                          <summary className="cursor-pointer hover:text-ink">What we heard</summary>
                          <p className="mt-1 text-soft leading-relaxed">{result.transcript}</p>
                        </details>
                        <Link to="/signup" className="shrink-0 inline-flex items-center gap-1 min-h-8 px-3 rounded-md bg-ink text-paper text-[11px] font-semibold hover:opacity-90">
                          Full interview, free <Icon name="arrow" size={12} />
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Base: hinge and the front edge of the keyboard deck */}
          <div aria-hidden="true" className="laptop-deck relative mx-[-7%] h-3.5 rounded-b-[14px] shadow-[0_18px_30px_-12px_rgba(16,24,40,0.45)]">
            <span className="laptop-notch absolute left-1/2 top-0 -translate-x-1/2 w-24 h-1.5 rounded-b-md" />
          </div>
          <div aria-hidden="true" className="mx-auto mt-2 w-[80%] h-5 rounded-[50%] bg-black/15 blur-xl" />
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted">Your recording is turned into text for scoring, then deleted.</p>
      {touched && <VoiceHint className="mt-1 text-center" />}
    </div>
  )
}
