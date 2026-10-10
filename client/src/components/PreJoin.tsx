import { useEffect, useRef, useState } from 'react'
import { Select } from './Select'
import { Avatar, INTERVIEWERS, type InterviewerId } from './Avatar'
import { isRecordingSupported } from '../lib/recorder'
import { loadVoices, pickVoice, sortVoices, speak, stopSpeaking } from '../lib/speech'
import { VoiceHint } from './VoiceHint'
import { apiFetch } from '../lib/api'
import { Icon } from './ui'

export type RoomSettings = {
  interviewer: InterviewerId
  voiceURI: string | null
  answerMode: 'voice' | 'text'
  startMode: 'button' | 'auto' // start listening when I press "Start answering", or right after the question
  autoSendSeconds: 0 | 3 | 5 // 0 = only when I click Done
}

const SETTINGS_KEY = 'rfr-room-settings-v2' // v2: new default of moving on after a 5-second pause

// Remembered per browser for convenience; safe to lose.
export function loadSettings(): RoomSettings {
  const defaults: RoomSettings = {
    interviewer: 'priya',
    voiceURI: null,
    answerMode: isRecordingSupported() ? 'voice' : 'text',
    startMode: 'button',
    autoSendSeconds: 5,
  }
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}')
    const merged = { ...defaults, ...saved }
    if (!isRecordingSupported()) merged.answerMode = 'text'
    return merged
  } catch {
    return defaults
  }
}

export function saveSettings(s: RoomSettings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)) } catch { /* private mode etc. */ }
}

export function PreJoin({ roundLabel, rate, onJoin }: {
  roundLabel: string
  rate: number
  onJoin: (settings: RoomSettings, stream: MediaStream | null, voice: SpeechSynthesisVoice | null) => void
}) {
  const [settings, setSettings] = useState<RoomSettings>(loadSettings)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [level, setLevel] = useState(0)
  const [voiceServiceReady, setVoiceServiceReady] = useState(true) // can the server turn speech into text?
  const videoRef = useRef<HTMLVideoElement>(null)
  const joinedRef = useRef(false)

  // Ask for camera + microphone. If the camera is refused, try microphone only.
  useEffect(() => {
    let s: MediaStream | null = null
    let cancelled = false // true if this screen closed before the camera finished starting
    ;(async () => {
      try {
        s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      } catch {
        try {
          s = await navigator.mediaDevices.getUserMedia({ audio: true })
          if (!cancelled) setMediaError('Camera not available. You can still do the interview with your microphone.')
        } catch {
          if (!cancelled) setMediaError('Camera and microphone are blocked. Allow them in the address bar, or type your answers.')
        }
      }
      if (cancelled) s?.getTracks().forEach((t) => t.stop())
      else setStream(s)
    })()
    return () => {
      cancelled = true
      if (!joinedRef.current) s?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream
  }, [stream])

  // Mic level meter: measures how loud the microphone input is, many times per second.
  useEffect(() => {
    if (!stream?.getAudioTracks().length) return
    const ctx = new AudioContext()
    const analyser = ctx.createAnalyser()
    ctx.createMediaStreamSource(stream).connect(analyser)
    const data = new Uint8Array(analyser.fftSize)
    let frame = 0
    const tick = () => {
      analyser.getByteTimeDomainData(data)
      let peak = 0
      for (const v of data) peak = Math.max(peak, Math.abs(v - 128))
      setLevel(Math.min(1, peak / 64))
      frame = requestAnimationFrame(tick)
    }
    tick()
    return () => { cancelAnimationFrame(frame); ctx.close() }
  }, [stream])

  useEffect(() => { loadVoices().then(setVoices) }, [])

  // Ask the server whether spoken answers can be processed right now.
  useEffect(() => {
    apiFetch<{ voiceAnswersReady: boolean }>('/health')
      .then((h) => setVoiceServiceReady(h.voiceAnswersReady))
      .catch(() => setVoiceServiceReady(false))
  }, [])

  const gender = INTERVIEWERS[settings.interviewer].gender
  const voice = voices.find((v) => v.voiceURI === settings.voiceURI) ?? pickVoice(voices, gender)
  const update = (patch: Partial<RoomSettings>) => setSettings((s) => ({ ...s, ...patch }))

  const hasMic = !!stream?.getAudioTracks().length
  const hasCam = !!stream?.getVideoTracks().length
  // Speaking needs a microphone, browser support and the server's speech-to-text; otherwise typing is the only option.
  const canSpeak = hasMic && isRecordingSupported() && voiceServiceReady
  const answerMode = canSpeak ? settings.answerMode : 'text'

  function join() {
    stopSpeaking()
    saveSettings(settings) // save the student's preference, even if this device can't use voice today
    joinedRef.current = true
    onJoin({ ...settings, answerMode }, stream, voice)
  }

  return (
    <main className="min-h-screen bg-stage text-stage-text px-4 pt-4">
      <div className="max-w-4xl mx-auto py-6">
        <h1 className="text-2xl font-bold">Get ready: {roundLabel}</h1>
        <p className="text-stage-muted mt-1">Check your camera, microphone and speakers before you join.</p>

        <div className="grid md:grid-cols-2 gap-6 mt-6 [&>*]:min-w-0">
          {/* Camera preview + mic level */}
          <div>
            <div className="h-44 sm:h-auto sm:aspect-video bg-stage-card rounded-xl overflow-hidden flex items-center justify-center">
              {hasCam
                ? <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover mirror" />
                : <p className="text-stage-muted text-sm p-4 text-center">Camera off</p>}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-sm text-stage-soft w-24">Microphone</span>
              <div className="flex-1 h-2 bg-stage-raised rounded-full overflow-hidden">
                <div className="h-full bg-accent-bright transition-[width] duration-75" style={{ width: `${level * 100}%` }} />
              </div>
            </div>
            <p className="text-xs text-stage-muted mt-1">
              {hasMic ? 'Say something: the green bar should move.' : 'No microphone detected.'}
            </p>
            {mediaError && <p className="text-sm text-warn mt-3">{mediaError}</p>}
            <p className="text-xs text-stage-muted mt-3">
              Your video is never recorded or uploaded, and it is not used for scoring. Only your voice answers are sent, to turn them into text.
            </p>
          </div>

          {/* Settings */}
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-stage-soft mb-2">Your interviewer</p>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(INTERVIEWERS) as InterviewerId[]).map((id) => (
                  <button key={id} onClick={() => update({ interviewer: id, voiceURI: null })}
                    className={`rounded-xl p-3 border ${settings.interviewer === id ? 'border-accent-bright bg-accent-bright/15' : 'border-stage-line hover:border-stage-muted'}`}>
                    <div className="w-20 h-20 mx-auto rounded-full overflow-hidden ring-2 ring-line"><Avatar who={id} state="idle" /></div>
                    <p className="mt-1 font-medium">{INTERVIEWERS[id].name}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-stage-soft mb-2">Voice</p>
              <div className="flex gap-2">
                <Select stage label="Interviewer voice" className="flex-1 min-w-0" value={voice?.voiceURI ?? ''} onChange={(v) => update({ voiceURI: v })}
                  options={voices.length === 0 ? [{ value: '', label: 'Default voice' }] : sortVoices(voices, gender).map((v) => ({ value: v.voiceURI, label: v.name, hint: v.lang }))} />
                <button onClick={() => speak(`Hello, I'm ${INTERVIEWERS[settings.interviewer].name}. Can you hear me clearly?`, voice, rate)}
                  className="border border-stage-line rounded-lg px-3 text-sm hover:bg-stage-raised">
                  <Icon name="volume" size={15} /> Test
                </button>
              </div>
              <VoiceHint className="mt-2 text-stage-muted" />
            </div>

            <div>
              <p className="text-sm font-medium text-stage-soft mb-2">How will you answer?</p>
              <div className="grid grid-cols-2 gap-2">
                <button disabled={!canSpeak} onClick={() => update({ answerMode: 'voice' })}
                  className={`rounded-lg px-3 py-2 border text-sm disabled:opacity-40 ${answerMode === 'voice' ? 'border-accent-bright bg-accent-bright/15' : 'border-stage-line'}`}>
                  <Icon name="mic" size={15} /> Speak
                </button>
                <button onClick={() => update({ answerMode: 'text' })}
                  className={`rounded-lg px-3 py-2 border text-sm ${answerMode === 'text' ? 'border-accent-bright bg-accent-bright/15' : 'border-stage-line'}`}>
                  <Icon name="keyboard" size={15} /> Type
                </button>
              </div>
              {!isRecordingSupported() && (
                <p className="text-xs text-warn mt-1">Your browser can't record audio. Please update it, or type your answers here.</p>
              )}
              {isRecordingSupported() && !hasMic && (
                <p className="text-xs text-warn mt-1">No microphone found, so you'll type your answers.</p>
              )}
              {hasMic && !voiceServiceReady && (
                <p className="text-xs text-warn mt-1">Spoken answers are unavailable right now, so please type your answers.</p>
              )}
            </div>

            {answerMode === 'voice' && (
              <>
                <div>
                  <p className="text-sm font-medium text-stage-soft mb-2">Start listening</p>
                  <div className="grid grid-cols-2 gap-2">
                    {([['button', 'When I press "Start answering"'], ['auto', 'Right after the question']] as const).map(([mode, label]) => (
                      <button key={mode} onClick={() => update({ startMode: mode })}
                        className={`rounded-lg px-2 py-2 border text-sm ${settings.startMode === mode ? 'border-accent-bright bg-accent-bright/15' : 'border-stage-line'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-stage-soft mb-2">Send my answer</p>
                  <div className="grid grid-cols-3 gap-2">
                    {([5, 3, 0] as const).map((s) => (
                      <button key={s} onClick={() => update({ autoSendSeconds: s })}
                        className={`rounded-lg px-2 py-2 border text-sm ${settings.autoSendSeconds === s ? 'border-accent-bright bg-accent-bright/15' : 'border-stage-line'}`}>
                        {s === 0 ? 'When I press "Done"' : `After a ${s}s pause`}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Phones: pinned to the bottom of the screen so it's always in reach */}
            <div className="sticky bottom-0 -mx-4 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-stage/90 backdrop-blur md:static md:mx-0 md:p-0 md:bg-transparent md:backdrop-blur-none">
              <button onClick={join} className="w-full bg-accent-bright text-on-accent-bright hover:opacity-90 rounded-xl py-3.5 font-semibold inline-flex items-center justify-center gap-2">
                <Icon name="play" size={16} /> Join interview
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
