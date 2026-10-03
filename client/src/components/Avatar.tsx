export type InterviewerId = 'priya' | 'arjun'
export type AvatarState = 'idle' | 'speaking' | 'listening' | 'thinking'

export const INTERVIEWERS: Record<InterviewerId, { name: string; gender: 'female' | 'male'; photo: string }> = {
  priya: { name: 'Priya', gender: 'female', photo: '/interviewer-priya.webp' },
  arjun: { name: 'Arjun', gender: 'male', photo: '/interviewer-arjun.webp' },
}

// The interviewer's photo. A photo can't move its lips, so we show what's happening instead:
// while speaking, sound bars pulse at the bottom and the photo "breathes" slightly; while listening, a gentle nod.
export function Avatar({ who, state }: { who: InterviewerId; state: AvatarState }) {
  const person = INTERVIEWERS[who]
  return (
    <div className="relative w-full h-full" role="img" aria-label={`${person.name}, your interviewer, is ${state}`}>
      <img src={person.photo} alt="" draggable={false}
        className={`w-full h-full object-cover object-top select-none transition-transform duration-500 ${
          state === 'speaking' ? 'motion-safe:animate-[avatar-talk_1.6s_ease-in-out_infinite]' : state === 'listening' ? 'avatar-nod' : ''}`} />
      {state === 'speaking' && (
        <span className="absolute bottom-[9%] left-1/2 -translate-x-1/2 flex items-end gap-0.75 h-5 px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-sm" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="w-0.75 rounded-full bg-white motion-safe:animate-[voice-bar_0.9s_ease-in-out_infinite]"
              style={{ animationDelay: `${i * 0.12}s`, height: '40%' }} />
          ))}
        </span>
      )}
    </div>
  )
}
