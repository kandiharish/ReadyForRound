import { useState } from 'react'
import type { RoleOption } from '../types'

type RoleId = 'frontend' | 'backend' | 'fullstack' | 'data_analyst'
type Answer = { text: string; points: Partial<Record<RoleId, number>> }

// Each answer gives points to one or more roles. The role with the most points is suggested.
// Plain rules, no AI: it's instant, free, and gives the same result every time.
const QUESTIONS: { question: string; answers: Answer[] }[] = [
  {
    question: 'What do you enjoy most?',
    answers: [
      { text: 'Designing how things look on screen', points: { frontend: 2 } },
      { text: 'Making the logic work behind the scenes', points: { backend: 2 } },
      { text: 'Building a whole app from start to finish', points: { fullstack: 2 } },
      { text: 'Finding patterns and answers in numbers', points: { data_analyst: 2 } },
    ],
  },
  {
    question: 'Which project sounds most fun?',
    answers: [
      { text: 'A beautiful portfolio website', points: { frontend: 2 } },
      { text: 'A secure login system and API for a bank app', points: { backend: 2 } },
      { text: 'A complete food-ordering app', points: { fullstack: 2 } },
      { text: 'A dashboard of IPL cricket statistics', points: { data_analyst: 2 } },
    ],
  },
  {
    question: 'Which subject did you like most?',
    answers: [
      { text: 'Web design or graphics', points: { frontend: 2 } },
      { text: 'DBMS, operating systems or networks', points: { backend: 2 } },
      { text: 'Software engineering', points: { fullstack: 2 } },
      { text: 'Maths or statistics', points: { data_analyst: 2 } },
    ],
  },
  {
    question: 'How do you like to work?',
    answers: [
      { text: 'I like seeing my results instantly on screen', points: { frontend: 2 } },
      { text: 'I like solving tricky logic puzzles', points: { backend: 2 } },
      { text: 'I like doing a bit of everything', points: { fullstack: 2 } },
      { text: 'I like answering business questions with data', points: { data_analyst: 2 } },
    ],
  },
  {
    question: 'How do you feel about coding?',
    answers: [
      { text: 'I love it and could code all day', points: { fullstack: 1, backend: 1 } },
      { text: 'I like it most when the result is visual', points: { frontend: 1 } },
      { text: 'I enjoy logic-heavy code', points: { backend: 1 } },
      { text: 'I prefer tools like Excel and SQL over heavy coding', points: { data_analyst: 2 } },
    ],
  },
]

export function RoleQuiz({ roles, onPick, onCancel }: {
  roles: RoleOption[]
  onPick: (roleId: string) => void
  onCancel: () => void
}) {
  const [step, setStep] = useState(0)
  const [scores, setScores] = useState<Record<RoleId, number>>({ frontend: 0, backend: 0, fullstack: 0, data_analyst: 0 })

  function answer(a: Answer) {
    const next = { ...scores }
    for (const [role, pts] of Object.entries(a.points)) next[role as RoleId] += pts
    setScores(next)
    setStep(step + 1)
  }

  if (step >= QUESTIONS.length) {
    const bestId = (Object.keys(scores) as RoleId[]).reduce((a, b) => (scores[b] > scores[a] ? b : a))
    const best = roles.find((r) => r.id === bestId)!
    return (
      <div className="border border-accent/40 bg-accent-soft rounded-xl p-5">
        <p className="text-sm text-accent-deep font-medium">Our suggestion for you</p>
        <p className="text-xl font-bold text-ink mt-1">{best.label}</p>
        <p className="text-soft mt-1">{best.description}</p>
        <p className="text-xs text-muted mt-3">
          This is just a starting point. You can change your role any time.
        </p>
        <div className="flex gap-2 mt-4">
          <button onClick={() => onPick(best.id)} className="bg-accent text-on-accent rounded-lg px-4 py-2 font-medium">
            Choose {best.label}
          </button>
          <button onClick={onCancel} className="text-soft px-4 py-2">Pick myself</button>
        </div>
      </div>
    )
  }

  const q = QUESTIONS[step]
  return (
    <div className="border border-line rounded-xl p-5">
      <p className="text-xs text-muted">Question {step + 1} of {QUESTIONS.length}</p>
      <p className="font-semibold text-ink mt-1">{q.question}</p>
      <div className="mt-3 space-y-2">
        {q.answers.map((a) => (
          <button key={a.text} onClick={() => answer(a)}
            className="w-full text-left border border-line-strong rounded-lg px-3 py-2 hover:border-accent hover:bg-accent-soft">
            {a.text}
          </button>
        ))}
      </div>
      <button onClick={onCancel} className="text-sm text-muted mt-3">Cancel quiz</button>
    </div>
  )
}
