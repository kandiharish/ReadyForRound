import { useEffect, useState } from 'react'

export type InterviewerId = 'priya' | 'arjun'
export type AvatarState = 'idle' | 'speaking' | 'listening' | 'thinking'

export const INTERVIEWERS: Record<InterviewerId, { name: string; gender: 'female' | 'male' }> = {
  priya: { name: 'Priya', gender: 'female' },
  arjun: { name: 'Arjun', gender: 'male' },
}

const LOOKS = {
  priya: { skin: '#C68B5E', hair: '#1F1410', blazer: '#334155', shirt: '#F1F5F9' },
  arjun: { skin: '#A8714A', hair: '#1A1311', blazer: '#1E3A5F', shirt: '#E2E8F0' },
}

// A drawn interviewer (SVG = shapes described in code, so it's tiny and works on any phone).
export function Avatar({ who, state }: { who: InterviewerId; state: AvatarState }) {
  const look = LOOKS[who]
  const mouthOpen = useMouthMovement(state === 'speaking')

  return (
    <svg viewBox="0 0 200 200" className={`w-full h-full ${state === 'listening' ? 'avatar-nod' : ''}`} role="img"
      aria-label={`${INTERVIEWERS[who].name}, your interviewer, is ${state}`}>
      {/* Long hair behind the head (Priya) */}
      {who === 'priya' && <path d="M58 92 Q56 40 100 38 Q144 40 142 92 L146 150 Q100 160 54 150 Z" fill={look.hair} />}

      {/* Shoulders: blazer and shirt */}
      <path d="M30 200 Q34 158 78 148 L122 148 Q166 158 170 200 Z" fill={look.blazer} />
      <path d="M86 148 L100 176 L114 148 Z" fill={look.shirt} />
      <path d="M78 148 L100 182 L92 200 L70 200 Z M122 148 L100 182 L108 200 L130 200 Z" fill={look.blazer} opacity="0.85" />
      {who === 'arjun' && <path d="M97 160 L103 160 L105 190 L100 196 L95 190 Z" fill="#7F1D1D" />}

      {/* Neck and head */}
      <rect x="88" y="120" width="24" height="32" rx="8" fill={look.skin} />
      <ellipse cx="100" cy="92" rx="34" ry="40" fill={look.skin} />
      <ellipse cx="66" cy="95" rx="5" ry="8" fill={look.skin} />
      <ellipse cx="134" cy="95" rx="5" ry="8" fill={look.skin} />

      {/* Hair on top */}
      {who === 'priya'
        ? <path d="M66 84 Q64 50 100 48 Q138 50 134 84 Q120 62 96 66 Q80 70 66 84 Z" fill={look.hair} />
        : <path d="M66 86 Q62 48 100 46 Q140 48 134 86 Q132 66 120 62 Q100 58 80 62 Q68 68 66 86 Z" fill={look.hair} />}

      {/* Eyebrows (raised a little while listening) */}
      <g transform={state === 'listening' ? 'translate(0,-2)' : undefined} className="transition-transform">
        <path d="M78 78 Q86 74 94 78" stroke={look.hair} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M106 78 Q114 74 122 78" stroke={look.hair} strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>

      {/* Eyes (blink every few seconds) */}
      <g className="avatar-blink">
        <ellipse cx="86" cy="90" rx="4.5" ry="5" fill="#1E293B" />
        <ellipse cx="114" cy="90" rx="4.5" ry="5" fill="#1E293B" />
        <circle cx="87.5" cy="88.5" r="1.3" fill="white" />
        <circle cx="115.5" cy="88.5" r="1.3" fill="white" />
      </g>

      {/* Nose */}
      <path d="M100 94 Q97 104 100 106 Q103 106 104 104" stroke="#00000030" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Mouth: opens and closes while speaking, gentle smile otherwise */}
      {state === 'speaking'
        ? <ellipse cx="100" cy="116" rx={8 + mouthOpen * 2} ry={1.5 + mouthOpen * 6} fill="#5B1F1F" />
        : <path d="M90 115 Q100 122 110 115" stroke="#5B1F1F" strokeWidth="3" fill="none" strokeLinecap="round" />}

      {/* Beard shadow (Arjun) */}
      {who === 'arjun' && <path d="M72 104 Q76 132 100 134 Q124 132 128 104 Q122 124 100 126 Q78 124 72 104 Z" fill={look.hair} opacity="0.35" />}
    </svg>
  )
}

// While speaking, open the mouth by a random amount a few times per second, which looks like talking.
function useMouthMovement(active: boolean) {
  const [open, setOpen] = useState(0)
  useEffect(() => {
    if (!active) return setOpen(0)
    const id = setInterval(() => setOpen(Math.random()), 110)
    return () => clearInterval(id)
  }, [active])
  return open
}
