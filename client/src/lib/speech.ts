// Text-to-Speech: makes the interviewer talk, using the voices built into the browser/OS (free).

export type Gender = 'female' | 'male'

// Voices don't say their gender, so we guess from well-known voice names.
const FEMALE_NAMES = /female|heera|neerja|swara|kalpana|veena|zira|aria|jenny|samantha|sonia|libby|natasha|susan|hazel|karen|moira|google us english/i
const MALE_NAMES = /\bmale\b|ravi|prabhat|madhur|hemant|rishi|david|mark|guy|ryan|daniel|george|thomas|alex|fred/i

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

// The voice list loads asynchronously in some browsers, so wait for it.
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!isSpeechSupported()) return resolve([])
    const voices = speechSynthesis.getVoices()
    if (voices.length) return resolve(englishOnly(voices))
    const done = () => resolve(englishOnly(speechSynthesis.getVoices()))
    speechSynthesis.addEventListener('voiceschanged', done, { once: true })
    setTimeout(done, 2000) // some browsers never fire the event
  })
}

const englishOnly = (voices: SpeechSynthesisVoice[]) => voices.filter((v) => v.lang.toLowerCase().startsWith('en'))

export function voiceGender(v: SpeechSynthesisVoice): Gender | null {
  if (FEMALE_NAMES.test(v.name)) return 'female'
  if (MALE_NAMES.test(v.name)) return 'male'
  return null
}

// Pick the best voice: matching gender, Indian English, and "natural"/online voices sound most human.
export function pickVoice(voices: SpeechSynthesisVoice[], gender: Gender) {
  const score = (v: SpeechSynthesisVoice) =>
    (voiceGender(v) === gender ? 4 : 0) +
    (v.lang === 'en-IN' || v.lang === 'en_IN' ? 3 : 0) +
    (/natural|online|google/i.test(v.name) ? 2 : 0)
  return [...voices].sort((a, b) => score(b) - score(a))[0] ?? null
}

// Speak text aloud. Resolves when finished (or cancelled).
// Long text is split into sentences because Chrome stops long utterances after ~15 seconds.
// pitch: 1 is normal; small changes help tell several speakers apart (group discussion).
export function speak(text: string, voice: SpeechSynthesisVoice | null, rate = 1, pitch = 1): Promise<void> {
  if (!isSpeechSupported()) return Promise.resolve()
  // Chrome sometimes silently drops speech started immediately after cancel(), or stays "paused".
  // So: cancel, resume, and wait a moment before speaking.
  const wasBusy = speechSynthesis.speaking || speechSynthesis.pending
  speechSynthesis.cancel()
  speechSynthesis.resume()
  const sentences = text.match(/[^.!?]+[.!?]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [text]

  return new Promise((resolve) => {
    let i = 0
    let timer: ReturnType<typeof setTimeout>
    const finish = () => { clearTimeout(timer); resolve() }
    const next = () => {
      clearTimeout(timer)
      if (i >= sentences.length) return finish()
      const sentence = sentences[i++]
      const u = new SpeechSynthesisUtterance(sentence)
      if (voice) u.voice = voice
      u.lang = voice?.lang ?? 'en-IN'
      u.rate = rate
      u.pitch = pitch
      let moved = false // make sure each sentence moves us forward only once
      const advance = () => { if (!moved) { moved = true; next() } }
      u.onend = advance
      u.onerror = () => { moved = true; finish() } // "interrupted"/"canceled" happen when we stop speech on purpose
      // Safety net: some browsers occasionally never fire "end". Move on after a generous time estimate.
      timer = setTimeout(advance, (sentence.split(/\s+/).length * 600) / rate + 4000)
      speechSynthesis.speak(u)
    }
    if (wasBusy) setTimeout(next, 150)
    else next()
  })
}

export function stopSpeaking() {
  if (isSpeechSupported()) speechSynthesis.cancel()
}
