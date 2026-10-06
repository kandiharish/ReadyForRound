// Speaking coach: simple delivery numbers for one spoken answer, worked out from the transcript and
// Whisper's timings. No extra AI call, and no audio is kept: only these numbers are saved.

export type SpeechStats = {
  seconds: number // length of the recording
  words: number
  wpm: number // speaking speed, words per minute of speech
  pauses: number // silences longer than 2.5 seconds in the middle of the answer
  fillers: Record<string, number> // e.g. { basically: 3, um: 2 }
}

export type Segment = { start: number; end: number; text: string }

// Filler words and phrases. "like" counts only in its filler form (", like,"), not "I like Python".
const FILLERS: [string, RegExp][] = [
  ['um', /\b(um+|umm+|erm+)\b/gi],
  ['uh', /\b(uh+|er|ah+)\b/gi],
  ['hmm', /\bhm+\b/gi],
  ['basically', /\bbasically\b/gi],
  ['actually', /\bactually\b/gi],
  ['literally', /\bliterally\b/gi],
  ['you know', /\byou know\b(?! (how|what|why|that|when|where|the|a|an|about)\b)/gi],
  ['I mean', /\bI mean\b(?! (that|the|a|an|to)\b)/gi],
  ['like', /(^|[,.] ?|\.\.\. ?)like,/gi],
  ['kind of', /\b(kind|sort) of\b(?= (like|a|an|the)?\s?[,.])/gi],
  ['so yeah', /\bso,? yeah\b/gi],
]

export function analyseSpeech(text: string, duration: number, segments: Segment[]): SpeechStats {
  const words = text.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length

  // Speaking time: the recording minus long silences, so a slow start doesn't make you look slow.
  let pauses = 0
  let silence = 0
  const sorted = [...segments].sort((a, b) => a.start - b.start)
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i].start - sorted[i - 1].end
    if (gap > 2.5) { pauses += 1; silence += gap }
  }
  const lead = sorted[0]?.start ?? 0
  const tail = sorted.length ? Math.max(0, duration - sorted[sorted.length - 1].end) : 0
  const speaking = Math.max(1, duration - silence - lead - tail)

  const fillers: Record<string, number> = {}
  for (const [name, re] of FILLERS) {
    const n = text.match(re)?.length ?? 0
    if (n) fillers[name] = n
  }

  return {
    seconds: Math.round(duration),
    words,
    wpm: words >= 8 ? Math.round((words / speaking) * 60) : 0, // too short to measure speed fairly
    pauses,
    fillers,
  }
}
