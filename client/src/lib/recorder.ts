// Records the student's spoken answer as an audio file (in the browser), and measures how loud
// they are while speaking so we can show "we can hear you" signals and detect pauses.

export function isRecordingSupported() {
  return typeof window !== 'undefined' && 'MediaRecorder' in window
}

// Pick an audio format this browser can record (Chrome/Edge/Firefox: webm, Safari: mp4).
function pickMimeType() {
  for (const type of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return ''
}

const SPEECH_LEVEL = 0.12 // loudness (0..1) we treat as "the student is speaking"

export type Recording = {
  stop(): Promise<Blob> // finish and get the audio file
  cancel(): void // throw the recording away
}

export function startRecording(
  stream: MediaStream,
  opts: {
    onLevel: (level: number) => void // 0..1, many times per second
    onSpeech: () => void // called once, the first time we hear speech
    silenceSeconds: number // 0 = never auto-stop on silence
    onSilence: () => void // called once after speech followed by this much silence
  },
): Recording {
  const audioOnly = new MediaStream(stream.getAudioTracks())
  const mimeType = pickMimeType()
  const recorder = new MediaRecorder(audioOnly, mimeType ? { mimeType } : undefined)
  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
  recorder.start(250) // hand us data every 250 ms

  // Loudness meter.
  const ctx = new AudioContext()
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 512
  ctx.createMediaStreamSource(audioOnly).connect(analyser)
  const samples = new Uint8Array(analyser.fftSize)
  let heardSpeech = false
  let lastLoudAt = performance.now()
  let silenceFired = false
  let frame = 0

  const tick = () => {
    analyser.getByteTimeDomainData(samples)
    let sum = 0
    for (const v of samples) sum += ((v - 128) / 128) ** 2
    const level = Math.min(1, Math.sqrt(sum / samples.length) * 4) // RMS, scaled up to feel lively
    opts.onLevel(level)

    const now = performance.now()
    if (level > SPEECH_LEVEL) {
      lastLoudAt = now
      if (!heardSpeech) { heardSpeech = true; opts.onSpeech() }
    } else if (heardSpeech && opts.silenceSeconds > 0 && !silenceFired && now - lastLoudAt > opts.silenceSeconds * 1000) {
      silenceFired = true
      opts.onSilence()
    }
    frame = requestAnimationFrame(tick)
  }
  tick()

  const cleanup = () => {
    cancelAnimationFrame(frame)
    ctx.close().catch(() => {})
  }

  return {
    stop() {
      cleanup()
      return new Promise((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }))
        if (recorder.state !== 'inactive') recorder.stop()
        else resolve(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }))
      })
    },
    cancel() {
      cleanup()
      recorder.onstop = null
      if (recorder.state !== 'inactive') recorder.stop()
    },
  }
}
