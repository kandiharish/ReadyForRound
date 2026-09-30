import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ApiError, apiFetch } from '../lib/api'
import { Avatar, INTERVIEWERS, type AvatarState } from '../components/Avatar'
import { PreJoin, type RoomSettings } from '../components/PreJoin'
import { speak, stopSpeaking } from '../lib/speech'
import { isRecordingSupported, startRecording, type Recording } from '../lib/recorder'
import type { Catalog, Interview, Profile, RoundId } from '../types'

export default function InterviewRoom() {
  const { id } = useParams()
  const [interview, setInterview] = useState<Interview | null>(null)
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [rate, setRate] = useState(1)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Set when the student clicks "Join interview".
  const [joined, setJoined] = useState<{ settings: RoomSettings; stream: MediaStream | null; voice: SpeechSynthesisVoice | null } | null>(null)

  // Turn the camera and mic off when the interview ends or the student leaves this page.
  // (Done here, not inside LiveRoom, so React's development re-mounting can't switch them off mid-interview.)
  const stream = joined?.stream
  const active = interview?.status === 'in_progress'
  useEffect(() => {
    if (!stream) return
    const stopTracks = () => stream.getTracks().forEach((t) => t.stop())
    if (!active) return stopTracks()
    return stopTracks
  }, [stream, active])

  useEffect(() => {
    Promise.all([apiFetch<Interview>(`/interviews/${id}`), apiFetch<Catalog>('/catalog'), apiFetch<Profile>('/me')])
      .then(([i, c, me]) => {
        setInterview(i)
        setCatalog(c)
        setRate(me.speaking_pace === 'slow' ? 0.85 : 1)
      })
      .catch((err) => setLoadError(err.message))
  }, [id])

  if (!interview || !catalog) {
    return <main className="min-h-screen bg-slate-900 text-slate-300 p-8">{loadError ?? 'Loading interview…'}</main>
  }

  const roundLabel = (r: RoundId) => catalog.rounds.find((x) => x.id === r)?.label ?? r
  const title = interview.mode === 'complete' ? 'Complete interview' : `${roundLabel(interview.rounds[0])} round`

  if (interview.status !== 'in_progress') return <Finished interview={interview} />
  if (!joined) {
    return <PreJoin roundLabel={title} rate={rate} onJoin={(settings, stream, voice) => setJoined({ settings, stream, voice })} />
  }
  return <LiveRoom interview={interview} setInterview={setInterview} roundLabel={roundLabel} rate={rate} {...joined} />
}

function LiveRoom({ interview, setInterview, roundLabel, rate, settings, stream, voice }: {
  interview: Interview
  setInterview: (i: Interview) => void
  roundLabel: (r: RoundId) => string
  rate: number
  settings: RoomSettings
  stream: MediaStream | null
  voice: SpeechSynthesisVoice | null
}) {
  const [avatarState, setAvatarState] = useState<AvatarState>('idle')
  const [answerMode, setAnswerMode] = useState(settings.answerMode)
  const [camOn, setCamOn] = useState(true)
  const [typed, setTyped] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [seconds, setSeconds] = useState(0)
  const [level, setLevel] = useState(0) // how loud the student is right now (0..1)
  const [heardVoice, setHeardVoice] = useState(false) // have we heard speech in this answer yet?
  const [recSeconds, setRecSeconds] = useState(0) // length of the current recording
  const [failedAudio, setFailedAudio] = useState<Blob | null>(null) // kept so the student can resend after an error

  const videoRef = useRef<HTMLVideoElement>(null)
  const recordingRef = useRef<Recording | null>(null)
  const levelRef = useRef(0)
  const recStartedAt = useRef(0)
  const spokenSeq = useRef(0) // which question we've already read aloud
  const speakTurn = useRef(0) // increases every time we start speaking; lets an older, cancelled speech know it's stale
  const busy = useRef(false)
  const finishRef = useRef<() => void>(() => {})

  const current = interview.turns[interview.turns.length - 1]
  const currentRound = interview.rounds[interview.current_round_index]
  const mainInRound = interview.turns.filter((t) => t.round === currentRound && !t.is_follow_up).length
  const interviewerName = INTERVIEWERS[settings.interviewer].name
  const canSpeak = !!stream?.getAudioTracks().length && isRecordingSupported()

  // Show the student's camera in the small tile.
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream
  }, [stream, camOn])

  useEffect(() => {
    stream?.getVideoTracks().forEach((t) => (t.enabled = camOn))
  }, [camOn, stream])

  // Interview clock.
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // While recording: refresh the sound bars and recording timer ~10 times a second, and stop at 3 minutes.
  useEffect(() => {
    if (avatarState !== 'listening') return
    const t = setInterval(() => {
      setLevel(levelRef.current)
      const secs = Math.floor((performance.now() - recStartedAt.current) / 1000)
      setRecSeconds(secs)
      if (secs >= MAX_ANSWER_SECONDS) finishRef.current()
    }, 100)
    return () => clearInterval(t)
  }, [avatarState])

  const cancelRecording = useCallback(() => {
    recordingRef.current?.cancel()
    recordingRef.current = null
  }, [])

  // Leaving the room: stop talking and recording. Also forget which question was spoken, so if React
  // re-mounts this screen (it does this on purpose in development) the question is read aloud again.
  useEffect(() => () => {
    speakTurn.current++
    stopSpeaking()
    cancelRecording()
    spokenSeq.current = 0
  }, [cancelRecording])

  const sendAnswer = useCallback(async (answer: { audio: Blob } | { text: string } | { skip: true }) => {
    if (busy.current) return
    busy.current = true
    speakTurn.current++
    stopSpeaking()
    cancelRecording()
    setAvatarState('thinking')
    setError(null)
    setFailedAudio(null)
    try {
      const path = `/interviews/${interview.id}`
      const next = 'audio' in answer
        ? await apiFetch<Interview>(`${path}/answer-audio`, { method: 'POST', body: answer.audio })
        : await apiFetch<Interview>(`${path}/answer`, { method: 'POST', body: JSON.stringify('text' in answer ? { answer: answer.text } : { skip: true }) })
      setTyped('')
      if (next.status !== 'in_progress') {
        setAvatarState('speaking')
        await speak('Thank you, that brings us to the end of the interview. Well done for completing it.', voice, rate)
      }
      setInterview(next)
    } catch (err) {
      if ('audio' in answer && err instanceof ApiError && err.status === 503 && /voice/i.test(err.message)) {
        // The server can't turn speech into text at all right now: switch to typing so the student isn't stuck.
        setAnswerMode('text')
        setError("Your spoken answer couldn't be processed because voice answers are unavailable right now. Please type your answer below.")
      } else {
        if ('audio' in answer) setFailedAudio(answer.audio) // nothing is lost: they can send the same recording again
        setError(`Your answer wasn't sent: ${(err as Error).message}`)
      }
      setAvatarState('idle')
    } finally {
      busy.current = false
    }
  }, [cancelRecording, interview.id, rate, setInterview, voice])

  // "Done answering": stop recording and send the audio.
  const finishAnswer = useCallback(async () => {
    const rec = recordingRef.current
    if (!rec) return
    recordingRef.current = null
    const audio = await rec.stop()
    sendAnswer({ audio })
  }, [sendAnswer])
  finishRef.current = finishAnswer

  // "Start answering": begin recording from scratch.
  const startAnswer = useCallback(() => {
    if (!stream || !canSpeak) return
    cancelRecording()
    setError(null)
    setFailedAudio(null)
    setHeardVoice(false)
    setLevel(0)
    setRecSeconds(0)
    levelRef.current = 0
    recStartedAt.current = performance.now()
    setAvatarState('listening')
    recordingRef.current = startRecording(stream, {
      onLevel: (l) => { levelRef.current = l },
      onSpeech: () => setHeardVoice(true),
      silenceSeconds: settings.autoSendSeconds,
      onSilence: () => finishRef.current(),
    })
  }, [canSpeak, cancelRecording, settings.autoSendSeconds, stream])

  const askCurrentQuestion = useCallback(async () => {
    const turn = ++speakTurn.current
    cancelRecording()
    setAvatarState('speaking')
    await speak(current.question, voice, rate)
    if (turn !== speakTurn.current) return // a newer speech (repeat, next question, leaving) replaced this one
    // By default we wait for the student to press "Start answering", so they have time to think.
    if (answerMode === 'voice' && settings.startMode === 'auto') startAnswer()
    else setAvatarState('idle')
  }, [answerMode, cancelRecording, current.question, rate, settings.startMode, startAnswer, voice])

  // Each new question: read it aloud.
  useEffect(() => {
    if (current.answer === null && spokenSeq.current !== current.seq) {
      spokenSeq.current = current.seq
      askCurrentQuestion()
    }
  }, [current.seq, current.answer, askCurrentQuestion])

  function switchMode(mode: 'voice' | 'text') {
    setAnswerMode(mode)
    cancelRecording()
    if (avatarState === 'listening') setAvatarState('idle')
  }

  const clock = formatTime(seconds)

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 text-sm">
        <span className="font-semibold text-indigo-300">ReadyForRound</span>
        <span className="text-slate-300">
          {roundLabel(currentRound)} round · Q{mainInRound} of {interview.questionsPerRound}
          {interview.rounds.length > 1 && ` · Round ${interview.current_round_index + 1}/${interview.rounds.length}`}
        </span>
        <span className="text-slate-400 tabular-nums">{clock}</span>
      </header>

      {/* Video area: interviewer big, student small */}
      <section className="relative flex-1 mx-4 rounded-2xl bg-linear-to-b from-slate-700 to-slate-800 overflow-hidden flex items-center justify-center min-h-75">
        <div className={`w-56 h-56 sm:w-72 sm:h-72 rounded-full bg-slate-600/40 p-2 transition-shadow ${
          avatarState === 'speaking' ? 'shadow-[0_0_0_6px_rgba(129,140,248,0.6)]' : ''}`}>
          <Avatar who={settings.interviewer} state={avatarState} />
        </div>
        {avatarState === 'thinking' && (
          <div className="absolute top-[18%] right-[28%] bg-white text-slate-700 rounded-full px-3 py-1 text-lg animate-pulse">•••</div>
        )}
        <span className="absolute bottom-3 left-3 bg-black/50 rounded px-2 py-0.5 text-sm">{interviewerName} · Interviewer</span>

        {/* Student's camera tile: glows green with their voice while recording */}
        <div className="absolute bottom-3 right-3 w-32 sm:w-48 aspect-video bg-slate-950 rounded-lg overflow-hidden border-2 transition-colors"
          style={{
            borderColor: avatarState === 'listening' ? `rgba(74,222,128,${0.35 + level * 0.65})` : 'rgb(71,85,105)',
            boxShadow: avatarState === 'listening' ? `0 0 ${4 + level * 24}px rgba(74,222,128,${0.2 + level * 0.6})` : undefined,
          }}>
          {stream?.getVideoTracks().length && camOn
            ? <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover mirror" />
            : <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">Camera off</div>}
          <span className="absolute bottom-1 left-1 bg-black/50 rounded px-1 text-xs">You{avatarState === 'listening' ? ' 🎤' : ''}</span>
        </div>
      </section>

      {/* Question caption + answer status */}
      <section className="mx-4 mt-3 space-y-2">
        <div className="bg-black/40 rounded-xl px-4 py-3">
          <p className="text-xs text-indigo-300">{interviewerName}{current.is_follow_up ? ' · follow-up' : ''}</p>
          <p className="text-lg leading-snug">{current.question}</p>
        </div>

        {answerMode === 'voice' ? (
          <div className="bg-black/20 rounded-xl px-4 py-3 min-h-14 flex items-center gap-4">
            {avatarState === 'listening' ? (
              <>
                <span className="flex items-center gap-2 text-red-400 font-semibold tabular-nums shrink-0">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" /> REC {formatTime(recSeconds)}
                </span>
                <SoundBars level={level} />
                <p className={`text-sm ${heardVoice ? 'text-green-300' : recSeconds >= 5 ? 'text-amber-300' : 'text-slate-300'}`}>
                  {heardVoice
                    ? '✓ We can hear you. Press "Done answering" when you finish.'
                    : recSeconds >= 5
                      ? "We can't hear you yet. Check your microphone isn't muted."
                      : 'Recording… start speaking.'}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-300">
                {avatarState === 'speaking' && `${interviewerName} is asking…`}
                {avatarState === 'thinking' && '⏳ Processing your answer…'}
                {avatarState === 'idle' && 'Take a moment to think, then press "Start answering".'}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-black/20 rounded-xl p-3">
            <textarea value={typed} onChange={(e) => setTyped(e.target.value)} rows={3} maxLength={3000}
              placeholder="Type your answer…" disabled={avatarState === 'thinking'}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <div className="flex justify-end mt-2">
              <button onClick={() => sendAnswer({ text: typed })} disabled={!typed.trim() || avatarState === 'thinking'}
                className="bg-indigo-500 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40">Submit answer</button>
            </div>
          </div>
        )}

        {error && (
          <div className="flex flex-wrap items-center gap-3 text-sm text-amber-300">
            <span>{error}</span>
            {failedAudio && (
              <button onClick={() => sendAnswer({ audio: failedAudio })} className="underline text-white">Send my answer again</button>
            )}
          </div>
        )}
      </section>

      {/* Controls */}
      <footer className="flex flex-wrap items-center justify-center gap-2 p-4">
        {/* Main action: Start answering → Done answering */}
        {answerMode === 'voice' && (avatarState === 'listening' ? (
          <>
            <button onClick={finishAnswer} disabled={!heardVoice}
              className="bg-green-600 hover:bg-green-500 rounded-full px-6 py-3 font-semibold disabled:opacity-40">
              ✅ Done answering
            </button>
            <Control onClick={startAnswer}>↺ Start again</Control>
          </>
        ) : (
          <button onClick={startAnswer} disabled={avatarState !== 'idle'}
            className="bg-green-600 hover:bg-green-500 rounded-full px-6 py-3 font-semibold disabled:opacity-40">
            🎤 Start answering
          </button>
        ))}
        <Control onClick={() => setCamOn(!camOn)} active={camOn} disabled={!stream?.getVideoTracks().length}>{camOn ? '📷 Camera on' : '🚫 Camera off'}</Control>
        <Control onClick={() => askCurrentQuestion()} disabled={avatarState === 'thinking'}>🔁 Repeat question</Control>
        <Control onClick={() => switchMode(answerMode === 'voice' ? 'text' : 'voice')}
          disabled={avatarState === 'thinking' || (answerMode === 'text' && !canSpeak)}>
          {answerMode === 'voice' ? '⌨️ Type instead' : '🎤 Speak instead'}
        </Control>
        <Control onClick={() => sendAnswer({ skip: true })} disabled={avatarState === 'thinking'}>⏭️ Skip</Control>
        <EndButton interviewId={interview.id} onEnded={(i) => { speakTurn.current++; stopSpeaking(); cancelRecording(); setInterview(i) }} />
      </footer>
    </main>
  )
}

const MAX_ANSWER_SECONDS = 180

const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

// Little bars that jump with the student's voice, so they can see they're being heard.
function SoundBars({ level }: { level: number }) {
  const shape = [0.5, 0.8, 1, 0.7, 0.9, 0.6, 0.4]
  return (
    <div className="flex items-center gap-1 h-8 shrink-0" aria-hidden>
      {shape.map((s, i) => (
        <span key={i} className="w-1.5 rounded-full bg-green-400 transition-[height] duration-100"
          style={{ height: `${Math.max(12, Math.min(100, level * s * 140))}%` }} />
      ))}
    </div>
  )
}

function Control({ children, onClick, active = true, disabled }: { children: React.ReactNode; onClick: () => void; active?: boolean; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`rounded-full px-4 py-2 text-sm disabled:opacity-40 ${active ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-600 hover:bg-red-500'}`}>
      {children}
    </button>
  )
}

function EndButton({ interviewId, onEnded }: { interviewId: string; onEnded: (i: Interview) => void }) {
  async function end() {
    if (!confirm('End this interview now? Your answers so far are saved.')) return
    onEnded(await apiFetch<Interview>(`/interviews/${interviewId}/end`, { method: 'POST' }))
  }
  return <button onClick={end} className="bg-red-600 hover:bg-red-500 rounded-full px-4 py-2 text-sm font-semibold">📞 End</button>
}

function Finished({ interview }: { interview: Interview }) {
  return (
    <main className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-green-900/40 border border-green-700 rounded-xl p-6 text-center">
          <p className="text-xl font-bold">{interview.status === 'completed' ? 'Interview complete 🎉' : 'Interview ended'}</p>
          <p className="text-green-200 text-sm mt-1">Your detailed feedback report is the next feature we're building.</p>
          <div className="flex justify-center gap-3 mt-4">
            <Link to="/interview/new" className="bg-indigo-500 rounded-lg px-4 py-2 font-medium">New interview</Link>
            <Link to="/dashboard" className="border border-slate-600 rounded-lg px-4 py-2">Dashboard</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
