// A calm, moving backdrop for the login and sign-up pages:
// real interview questions drift slowly up the screen, over soft colour blobs.

const TINTS = ['bg-sky text-sky-ink', 'bg-lavender text-lavender-ink', 'bg-peach text-peach-ink', 'bg-blush text-blush-ink', 'bg-sage text-sage-ink']

// left = where it floats (% of screen width); delay/duration make each one move at its own pace.
const QUESTIONS: { text: string; left: string; delay: number; duration: number; hideOnPhone?: boolean }[] = [
  { text: 'Tell me about yourself.', left: '5%', delay: 0, duration: 26 },
  { text: 'Why should we hire you?', left: '70%', delay: -7, duration: 30 },
  { text: 'What are your strengths?', left: '16%', delay: -15, duration: 28, hideOnPhone: true },
  { text: 'What is your biggest weakness?', left: '74%', delay: -21, duration: 25, hideOnPhone: true },
  { text: 'Where do you see yourself in 5 years?', left: '3%', delay: -10, duration: 32, hideOnPhone: true },
  { text: 'Why do you want to join us?', left: '62%', delay: -25, duration: 27 },
  { text: 'Describe a challenge you overcame.', left: '28%', delay: -4, duration: 34, hideOnPhone: true },
  { text: 'Walk me through your project.', left: '78%', delay: -13, duration: 29 },
  { text: 'Why are you leaving your current job?', left: '8%', delay: -19, duration: 31, hideOnPhone: true },
  { text: 'Do you have any questions for us?', left: '55%', delay: -30, duration: 33, hideOnPhone: true },
  { text: 'What motivates you?', left: '84%', delay: -2, duration: 24, hideOnPhone: true },
  { text: 'Tell me about a time you led a team.', left: '36%', delay: -18, duration: 30, hideOnPhone: true },
]

export function AuthBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -top-32 -left-24 w-136 h-136 rounded-full bg-sky opacity-80 blur-3xl motion-safe:animate-[blob-drift_20s_ease-in-out_infinite]" />
      <div className="absolute top-1/3 -right-32 w-120 h-120 rounded-full bg-lavender opacity-80 blur-3xl motion-safe:animate-[blob-drift_24s_ease-in-out_infinite_reverse]" />
      <div className="absolute -bottom-40 left-1/4 w-112 h-112 rounded-full bg-blush opacity-60 blur-3xl motion-safe:animate-[blob-drift_28s_ease-in-out_infinite]" />
      {QUESTIONS.map((q, i) => (
        <div key={q.text} className="absolute bottom-0 opacity-0 motion-safe:animate-[rise_linear_infinite] max-sm:hidden"
          style={{ left: q.left, animationDuration: `${q.duration}s`, animationDelay: `${q.delay}s` }}>
          <div className="motion-safe:animate-[sway_6s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.7}s` }}>
            <span className={`inline-block whitespace-nowrap rounded-2xl rounded-bl-sm px-4 py-2.5 font-display font-semibold text-lg shadow-sm border border-line/60 ${TINTS[i % TINTS.length]}`}>
              {q.text}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// Phones: two rows of questions that glide sideways, one above and one below the card, in opposite directions.
export function QuestionRow({ reverse = false }: { reverse?: boolean }) {
  const items = reverse ? [...QUESTIONS].reverse() : QUESTIONS
  const row = [...items, ...items] // repeated twice so the loop is seamless
  return (
    <div aria-hidden="true" className="sm:hidden relative w-screen shrink-0 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
      <div className={`flex w-max gap-2.5 motion-safe:animate-[marquee_38s_linear_infinite] ${reverse ? '[animation-direction:reverse]' : ''}`}>
        {row.map((q, i) => (
          <span key={i} className={`whitespace-nowrap rounded-2xl rounded-bl-sm px-3.5 py-2 font-display font-semibold text-base border border-line/60 shadow-sm ${TINTS[i % TINTS.length]}`}>
            {q.text}
          </span>
        ))}
      </div>
    </div>
  )
}
