import { apiFetch } from './api'
import type { Interview, RoundId } from '../types'

// A readable name for an interview or drill, e.g. "Technical round" or "Drill · JavaScript closures".
export function sessionTitle(s: { mode: 'single' | 'complete' | 'drill'; rounds: RoundId[]; focus_topic?: string | null }, roundLabel: (r: RoundId) => string) {
  if (s.mode === 'drill') return `5-minute drill · ${s.focus_topic ?? 'practice'}`
  if (s.mode === 'complete') return 'Complete interview'
  return `${roundLabel(s.rounds[0])} round`
}

// Start a 5-minute drill on a topic. Returns the new session so the caller can open the room.
export function startDrill(topic: string) {
  return apiFetch<Interview>('/interviews', { method: 'POST', body: JSON.stringify({ mode: 'drill', topic }) })
}
