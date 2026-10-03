import { useState } from 'react'
import type { RoleOption } from '../types'

type RoleId = 'sde' | 'frontend' | 'backend' | 'fullstack' | 'fde' | 'ai_engineer' | 'data_scientist' | 'data_engineer'
  | 'data_analyst' | 'devops' | 'mobile' | 'qa' | 'cybersecurity'
type Answer = { text: string; points: Partial<Record<RoleId, number>> }

// Each answer gives points to one or more roles. The role with the most points is suggested.
// Plain rules, no AI: it's instant, free, and gives the same result every time.
const QUESTIONS: { question: string; answers: Answer[] }[] = [
  {
    question: 'What do you enjoy most?',
    answers: [
      { text: 'Designing how things look and feel on screen', points: { frontend: 2, mobile: 1 } },
      { text: 'Solving tricky coding and logic puzzles', points: { sde: 2, backend: 1 } },
      { text: 'Teaching computers to learn, or building with AI', points: { ai_engineer: 2, data_scientist: 1 } },
      { text: 'Finding answers and patterns in data', points: { data_analyst: 2, data_scientist: 1 } },
      { text: 'Keeping systems fast, automated and running', points: { devops: 2, data_engineer: 1 } },
      { text: 'Helping real customers solve their problems with tech', points: { fde: 2, fullstack: 1 } },
    ],
  },
  {
    question: 'Which project sounds most fun?',
    answers: [
      { text: 'A complete food-ordering web app', points: { fullstack: 2, backend: 1 } },
      { text: 'A chatbot that answers questions from your college notes', points: { ai_engineer: 2 } },
      { text: 'A pipeline that moves millions of records every night', points: { data_engineer: 2 } },
      { text: 'An Android or iOS app for your college', points: { mobile: 2 } },
      { text: 'Finding security holes in a website (ethically)', points: { cybersecurity: 2 } },
      { text: 'A dashboard of IPL cricket statistics', points: { data_analyst: 2 } },
    ],
  },
  {
    question: 'Which subject did you like most?',
    answers: [
      { text: 'Data structures and algorithms', points: { sde: 2 } },
      { text: 'Web design or graphics', points: { frontend: 2 } },
      { text: 'DBMS and databases', points: { data_engineer: 1, backend: 2 } },
      { text: 'Maths, probability or statistics', points: { data_scientist: 2, ai_engineer: 1 } },
      { text: 'Computer networks or operating systems', points: { cybersecurity: 2, devops: 1 } },
      { text: 'Software engineering and testing', points: { qa: 2, sde: 1 } },
    ],
  },
  {
    question: 'How do you like to work?',
    answers: [
      { text: 'I like seeing my results instantly on screen', points: { frontend: 1, mobile: 2 } },
      { text: 'Talking to people, then building what they need', points: { fde: 2 } },
      { text: 'Answering business questions with numbers', points: { data_analyst: 2 } },
      { text: 'A bit of everything, end to end', points: { fullstack: 2 } },
      { text: 'Breaking things to make them better', points: { qa: 2, cybersecurity: 1 } },
      { text: 'Automating boring, repetitive work', points: { devops: 2, data_engineer: 1 } },
    ],
  },
  {
    question: 'How do you feel about coding?',
    answers: [
      { text: 'I love it and could code all day', points: { sde: 2, backend: 1 } },
      { text: 'I like code, but I also like explaining things to people', points: { fde: 2 } },
      { text: 'I prefer Excel, SQL and charts over heavy coding', points: { data_analyst: 2 } },
      { text: 'Python with data and models is my thing', points: { ai_engineer: 1, data_scientist: 1, data_engineer: 1 } },
      { text: 'I enjoy scripts, tools and the command line', points: { devops: 2, qa: 1 } },
      { text: 'I like code most when the result is visual', points: { frontend: 1, mobile: 1, fullstack: 1 } },
    ],
  },
]

export function RoleQuiz({ roles, onPick, onCancel }: {
  roles: RoleOption[]
  onPick: (roleId: string) => void
  onCancel: () => void
}) {
  const [step, setStep] = useState(0)
  const [scores, setScores] = useState<Record<string, number>>(() => Object.fromEntries(roles.map((r) => [r.id, 0])))

  function answer(a: Answer) {
    const next = { ...scores }
    for (const [role, pts] of Object.entries(a.points)) next[role] = (next[role] ?? 0) + pts
    setScores(next)
    setStep(step + 1)
  }

  if (step >= QUESTIONS.length) {
    const bestId = Object.keys(scores).reduce((a, b) => (scores[b] > scores[a] ? b : a))
    const best = roles.find((r) => r.id === bestId) ?? roles[0]
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
