import { useEffect, useState } from 'react'
import { hasNaturalIndianVoice, loadVoices } from '../lib/speech'

// Shown only when this browser has no natural Indian English voice: Microsoft Edge has them for free.
export function VoiceHint({ className = '' }: { className?: string }) {
  const [show, setShow] = useState(false)
  useEffect(() => { loadVoices().then((v) => setShow(!hasNaturalIndianVoice(v))).catch(() => {}) }, [])
  if (!show) return null
  return <p className={`text-xs text-muted ${className}`}>For a natural Indian English voice, open ReadyForRound in Microsoft Edge.</p>
}
