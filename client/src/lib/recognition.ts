// Speech-to-Text: turns the student's spoken answer into words, using the browser's built-in
// speech recognition (free; best in Chrome and Edge). TypeScript doesn't ship types for it, so we declare the bits we use.

type RecognitionResult = { isFinal: boolean; 0: { transcript: string } }
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> }
type Recognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: RecognitionEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

function getRecognitionClass(): (new () => Recognition) | null {
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function isRecognitionSupported() {
  return getRecognitionClass() !== null
}

export type Listener = { stop(): void }

// Start listening. `onText` is called with the confirmed text so far and the current guess ("interim")
// for the words still being spoken. Keeps listening until stop() is called.
export function startListening(opts: {
  lang?: string
  onText: (finalText: string, interimText: string) => void
  onError: (message: string) => void
}): Listener {
  const Rec = getRecognitionClass()
  if (!Rec) {
    opts.onError('Voice input is not supported in this browser. Please use Chrome or Edge, or type your answer.')
    return { stop() {} }
  }

  let active = true
  let finalText = ''
  let rec: Recognition

  const begin = () => {
    rec = new Rec()
    rec.lang = opts.lang ?? 'en-IN' // English (India) understands Indian accents best
    rec.continuous = true
    rec.interimResults = true

    rec.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) finalText += r[0].transcript.trim() + ' '
        else interim += r[0].transcript
      }
      opts.onText(finalText.trim(), interim.trim())
    }

    rec.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return // normal pauses; we just keep listening
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        active = false
        opts.onError('Microphone access was blocked. Allow it in the browser address bar, or type your answer.')
      } else if (e.error === 'network') {
        opts.onError('Voice recognition needs an internet connection. Check your connection or type your answer.')
      }
    }

    // Browsers stop recognition on their own after a pause; restart it while we still want to listen.
    rec.onend = () => {
      if (active) setTimeout(() => active && begin(), 100)
    }

    rec.start()
  }

  begin()
  return {
    stop() {
      active = false
      rec?.abort()
    },
  }
}
