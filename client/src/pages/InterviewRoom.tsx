import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { apiFetch } from '../lib/api'
import { Avatar, INTERVIEWERS, type AvatarState } from '../components/Avatar'
import { PreJoin, type RoomSettings } from '../components/PreJoin'
import { speak, stopSpeaking } from '../lib/speech'
import { isRecognitionSupported, startListening, type Listener } from '../lib/recognition'
import type { Catalog, Interview, Profile, RoundId } from '../types'

export default function InterviewRoom() {
  const { id } = useParams()
  const [interview, setInterview] = useState<Interview | null>(null)
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [rate, setRate] = useState(1)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Set when the student clicks "Join interview".
  const [joined, setJoined] = useState<{ settings: RoomSettings; stream: MediaStream | null; voice: SpeechSynthesisVoice | null } | null>(null)

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

  if (interview.status !== 'in_progress') return <Finished interview={interview} roundLabel={roundLabel} />
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
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [heard, setHeard] = useState({ final: '', interim: '' }) // live transcript of what the student is saying
  const [typed, setTyped] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showTranscript, setShowTranscript] = useState(false)
  const [seconds, setSeconds] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const listenerRef = useRef<Listener | null>(null)
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heardRef = useRef(heard)
  const spokenSeq = useRef(0) // which question we've already read aloud
  const busy = useRef(false)

  const current = interview.turns[interview.turns.length - 1]
  const currentRound = interview.rounds[interview.current_round_index]
  const mainInRound = interview.turns.filter((t) => t.round === currentRound && !t.is_follow_up).length
  const interviewerName = INTERVIEWERS[settings.interviewer].name

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

  const stopMic = useCallback(() => {
    listenerRef.current?.stop()
    listenerRef.current = null
    if (silenceTimer.current) clearTimeout(silenceTimer.current)
  }, [])

  // Leaving the page: stop talking, listening, and turn the camera/mic off.
  useEffect(() => () => {
    stopSpeaking()
    stopMic()
    stream?.getTracks().forEach((t) => t.stop())
  }, [stream, stopMic])

  const submit = useCallback(async (body: { answer: string } | { skip: true }) => {
    if (busy.current) return
    busy.current = true
    stopMic()
    stopSpeaking()
    setAvatarState('thinking')
    setError(null)
    try {
      const next = await apiFetch<Interview>(`/interviews/${interview.id}/answer`, { method: 'POST', body: JSON.stringify(body) })
      setHeard({ final: '', interim: '' })
      heardRef.current = { final: '', interim: '' }
      setTyped('')
      if (next.status !== 'in_progress') {
        setAvatarState('speaking')
        await speak('Thank you, that brings us to the end of the interview. Well done for completing it.', voice, rate)
      }
      setInterview(next)
    } catch (err) {
      // Keep what they said so nothing is lost; let them edit and resend as text.
      if ('answer' in body) setTyped(body.answer)
      setAnswerMode('text')
      setError(`${(err as Error).message} Your answer is in the box below. Press Submit to try again.`)
      setAvatarState('idle')
    } finally {
      busy.current = false
    }
  }, [interview.id, rate, setInterview, stopMic, voice])

  const sendSpokenAnswer = useCallback(() => {
    const text = `${heardRef.current.final} ${heardRef.current.interim}`.trim()
    if (text) submit({ answer: text })
  }, [submit])

  const listen = useCallback(() => {
    stopMic()
    setAvatarState('listening')
    listenerRef.current = startListening({
      onText: (final, interim) => {
        heardRef.current = { final, interim }
        setHeard({ final, interim })
        // Restart the pause timer every time new words arrive.
        if (silenceTimer.current) clearTimeout(silenceTimer.current)
        if (settings.autoSendSeconds > 0 && `${final}${interim}`.trim()) {
          silenceTimer.current = setTimeout(sendSpokenAnswer, settings.autoSendSeconds * 1000)
        }
      },
      onError: (msg) => {
        setError(msg)
        setAnswerMode('text')
        stopMic()
        setAvatarState('idle')
      },
    })
  }, [sendSpokenAnswer, settings.autoSendSeconds, stopMic])

  const askCurrentQuestion = useCallback(async () => {
    stopMic()
    setAvatarState('speaking')
    await speak(current.question, voice, rate)
    if (answerMode === 'voice' && micOn) listen()
    else setAvatarState('idle')
  }, [answerMode, current.question, listen, micOn, rate, stopMic, voice])

  // Each new question: read it aloud, then start listening.
  useEffect(() => {
    if (current.answer === null && spokenSeq.current !== current.seq) {
      spokenSeq.current = current.seq
      askCurrentQuestion()
    }
  }, [current.seq, current.answer, askCurrentQuestion])

  function toggleMic() {
    if (micOn) {
      stopMic()
      setAvatarState('idle')
    } else if (answerMode === 'voice' && avatarState !== 'speaking' && avatarState !== 'thinking') {
      listen()
    }
    setMicOn(!micOn)
  }

  function switchMode(mode: 'voice' | 'text') {
    setAnswerMode(mode)
    if (mode === 'text') {
      stopMic()
      setTyped((t) => t || `${heard.final} ${heard.interim}`.trim())
      if (avatarState === 'listening') setAvatarState('idle')
    } else if (micOn && avatarState === 'idle') {
      listen()
    }
  }

  const statusText = {
    speaking: `${interviewerName} is asking…`,
    listening: micOn ? '🎙️ Listening… take your time' : 'Mic is off',
    thinking: `${interviewerName} is thinking…`,
    idle: answerMode === 'text' ? 'Type your answer below' : 'Mic is off. Turn it on to answer',
  }[avatarState]

  const clock = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 text-sm">
        <span className="font-semibold text-indigo-300">ReadyForRound</span>
        <span className="text-slate-300">
          {roundLabel(currentRound)} round · Q{mainInRound} of {interview.questionsPerRound}
          {interview.rounds.length > 1 && ` · Round ${interview.current_round_index + 1}/${interview.rounds.length}`}
        </span>
        <span className="text-red-400 tabular-nums">● {clock}</span>
      </header>

      {/* Video area: interviewer big, student small */}
      <section className="relative flex-1 mx-4 rounded-2xl bg-gradient-to-b from-slate-700 to-slate-800 overflow-hidden flex items-center justify-center min-h-[300px]">
        <div className={`w-56 h-56 sm:w-72 sm:h-72 rounded-full bg-slate-600/40 p-2 transition-shadow ${
          avatarState === 'speaking' ? 'shadow-[0_0_0_6px_rgba(129,140,248,0.6)]'
            : avatarState === 'listening' && micOn ? 'shadow-[0_0_0_6px_rgba(74,222,128,0.5)]' : ''}`}>
          <Avatar who={settings.interviewer} state={avatarState} />
        </div>
        {avatarState === 'thinking' && (
          <div className="absolute top-[18%] right-[28%] bg-white text-slate-700 rounded-full px-3 py-1 text-lg animate-pulse">•••</div>
        )}
        <span className="absolute bottom-3 left-3 bg-black/50 rounded px-2 py-0.5 text-sm">{interviewerName} · Interviewer</span>

        {/* Student's camera tile */}
        <div className="absolute bottom-3 right-3 w-32 sm:w-48 aspect-video bg-slate-950 rounded-lg overflow-hidden border border-slate-600">
          {stream?.getVideoTracks().length && camOn
            ? <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover mirror" />
            : <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">Camera off</div>}
          <span className="absolute bottom-1 left-1 bg-black/50 rounded px-1 text-xs">You</span>
        </div>
      </section>

      {/* Captions */}
      <section className="mx-4 mt-3 space-y-2">
        <div className="bg-black/40 rounded-xl px-4 py-3">
          <p className="text-xs text-indigo-300">{interviewerName}{current.is_follow_up ? ' · follow-up' : ''}</p>
          <p className="text-lg leading-snug">{current.question}</p>
        </div>
        {answerMode === 'voice' ? (
          <div className="bg-black/20 rounded-xl px-4 py-3 min-h-[3.5rem]">
            <p className="text-xs text-green-300">{statusText}</p>
            <p className="text-slate-100">
              {heard.final} <span className="text-slate-400">{heard.interim}</span>
            </p>
          </div>
        ) : (
          <div className="bg-black/20 rounded-xl p-3">
            <textarea value={typed} onChange={(e) => setTyped(e.target.value)} rows={3} maxLength={3000}
              placeholder="Type your answer…" disabled={avatarState === 'thinking'}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <div className="flex justify-end mt-2">
              <button onClick={() => submit({ answer: typed })} disabled={!typed.trim() || avatarState === 'thinking'}
                className="bg-indigo-500 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40">Submit answer</button>
            </div>
          </div>
        )}
        {error && <p className="text-sm text-amber-300">{error}</p>}
      </section>

      {/* Controls */}
      <footer className="flex flex-wrap items-center justify-center gap-2 p-4">
        <Control onClick={toggleMic} active={micOn} disabled={answerMode === 'text'}>{micOn ? '🎤 Mic on' : '🔇 Mic off'}</Control>
        <Control onClick={() => setCamOn(!camOn)} active={camOn} disabled={!stream?.getVideoTracks().length}>{camOn ? '📷 Camera on' : '🚫 Camera off'}</Control>
        <Control onClick={() => askCurrentQuestion()} disabled={avatarState === 'thinking'}>🔁 Repeat question</Control>
        <Control onClick={() => switchMode(answerMode === 'voice' ? 'text' : 'voice')}
          disabled={answerMode === 'text' && !(stream?.getAudioTracks().length && isRecognitionSupported())}>
          {answerMode === 'voice' ? '⌨️ Type instead' : '🎤 Speak instead'}
        </Control>
        <Control onClick={() => submit({ skip: true })} disabled={avatarState === 'thinking'}>⏭️ Skip</Control>
        {answerMode === 'voice' && (
          <button onClick={sendSpokenAnswer} disabled={!`${heard.final}${heard.interim}`.trim() || avatarState === 'thinking'}
            className="bg-green-600 hover:bg-green-500 rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-40">
            ✅ Done answering
          </button>
        )}
        <EndButton interviewId={interview.id} onEnded={(i) => { stopSpeaking(); stopMic(); setInterview(i) }} />
        <button onClick={() => setShowTranscript(!showTranscript)} className="text-xs text-slate-400 underline ml-2">
          {showTranscript ? 'Hide' : 'Show'} transcript
        </button>
      </footer>

      {showTranscript && <Transcript interview={interview} roundLabel={roundLabel} className="mx-4 mb-4" />}
    </main>
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

function Transcript({ interview, roundLabel, className = '' }: { interview: Interview; roundLabel: (r: RoundId) => string; className?: string }) {
  return (
    <div className={`bg-slate-800 rounded-xl p-4 space-y-3 max-h-96 overflow-y-auto ${className}`}>
      {interview.turns.map((t, i) => (
        <div key={t.seq}>
          {(i === 0 || interview.turns[i - 1].round !== t.round) && (
            <p className="text-xs uppercase tracking-wide text-slate-500 text-center my-2">{roundLabel(t.round)} round</p>
          )}
          <p className="text-sm"><span className="text-indigo-300">Interviewer{t.is_follow_up ? ' (follow-up)' : ''}:</span> {t.question}</p>
          {t.answer !== null && (
            <p className="text-sm mt-1 pl-4"><span className="text-green-300">You:</span> {t.skipped ? <i className="text-slate-400">skipped</i> : t.answer}</p>
          )}
        </div>
      ))}
    </div>
  )
}

function Finished({ interview, roundLabel }: { interview: Interview; roundLabel: (r: RoundId) => string }) {
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
        <h2 className="font-semibold mt-8 mb-3">Transcript</h2>
        <Transcript interview={interview} roundLabel={roundLabel} />
      </div>
    </main>
  )
}
