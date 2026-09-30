import { config } from '../config.js'

// Speech-to-Text: turns a recorded answer into words using Whisper, hosted by Groq (free tier).
// Whisper is accurate with Indian English accents and works the same for every browser.

export class SttUnavailableError extends Error {}

const EXTENSIONS: Record<string, string> = { webm: 'webm', mp4: 'mp4', ogg: 'ogg', wav: 'wav', mpeg: 'mp3' }

export async function transcribe(audio: Buffer, mimeType: string, hint: string): Promise<string> {
  if (!config.GROQ_API_KEY) {
    throw new SttUnavailableError('Voice answers need GROQ_API_KEY in server/.env')
  }

  const ext = Object.entries(EXTENSIONS).find(([key]) => mimeType.includes(key))?.[1] ?? 'webm'
  const form = new FormData()
  form.append('file', new Blob([new Uint8Array(audio)], { type: mimeType }), `answer.${ext}`)
  form.append('model', config.GROQ_STT_MODEL)
  form.append('language', 'en')
  form.append('temperature', '0')
  // A hint about the topic (the interview question) helps Whisper spell technical words correctly.
  form.append('prompt', hint.slice(0, 500))

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.GROQ_API_KEY}` },
    body: form,
  }).catch((err) => {
    throw new SttUnavailableError(`Cannot reach Groq: ${(err as Error).message}`)
  })

  if (!res.ok) {
    const body = await res.text()
    if (res.status === 401) throw new SttUnavailableError('GROQ_API_KEY is not valid')
    if (res.status === 429) throw new SttUnavailableError('Voice service is busy (rate limit). Please try again shortly.')
    throw new Error(`Groq transcription failed (${res.status}): ${body.slice(0, 200)}`)
  }

  const data = (await res.json()) as { text?: string }
  return (data.text ?? '').trim()
}
