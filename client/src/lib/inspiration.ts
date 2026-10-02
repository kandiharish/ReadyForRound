// Encouragement and interview guidance shown on Home.
// These are original lines and widely shared interview advice, NOT quotes from or stories by real people.

export const THOUGHTS = [
  'An interview is a conversation, not an exam. They want you to do well.',
  'You don\'t need to know everything. You need to show how you think.',
  'Every practice round makes the real one feel familiar.',
  'Nervous means you care. Breathe, slow down, and start with what you know.',
  '"I\'m not sure, but here\'s how I\'d find out" is a strong answer.',
  'Progress beats perfection. One better answer today is a win.',
  'Your projects are your story. Tell it with confidence.',
  'Clear and simple beats long and complicated.',
  'A rejection is a redirection, not a verdict on your worth.',
  'Small daily practice turns into big confidence.',
  'Pause before you answer. Silence feels longer to you than to them.',
  'Ask a clarifying question. It shows you think before you build.',
  'The goal isn\'t to impress. It\'s to be understood.',
  'You are interviewing them too. Stay curious.',
  'Mistakes in practice are free lessons.',
  'Speak to one person, not to a panel. It\'s just a chat.',
  'Prepared beats perfect. You\'ve got this.',
  'Every expert once froze on "Tell me about yourself".',
  'Explain it like you\'re teaching a friend. That\'s mastery.',
  'Rest is part of preparation. A calm mind answers better.',
]

// Same thought for everyone on the same day; a new one tomorrow.
export function thoughtOfTheDay(date = new Date()) {
  const day = Math.floor(date.getTime() / 86_400_000)
  return THOUGHTS[day % THOUGHTS.length]
}

export type Story = {
  id: string
  title: string // short label under the circle
  tint: 'blush' | 'sage' | 'lavender' | 'peach' | 'sky'
  icon: string // SVG path
  slides: { heading: string; points: string[] }[]
}

export const STORIES: Story[] = [
  {
    id: 'what-they-look-for',
    title: 'What they look for',
    tint: 'lavender',
    icon: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    slides: [
      { heading: 'Interviewers are not hunting for a perfect answer', points: ['They want to see how you think, step by step.', 'A clear, honest partial answer beats a memorised one you can\'t explain.'] },
      { heading: 'The four things most interviewers score', points: ['Problem solving: do you break the problem down?', 'Fundamentals: do you understand the "why"?', 'Communication: can they follow you?', 'Attitude: are you curious and coachable?'] },
      { heading: 'Think out loud', points: ['Say what you\'re trying, even if it might be wrong.', 'Interviewers can only give credit for thinking they can hear.'] },
    ],
  },
  {
    id: 'service-vs-product',
    title: 'Service vs product',
    tint: 'sky',
    icon: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6',
    slides: [
      { heading: 'Service company drives (mass hiring)', points: ['Usually: online aptitude and reasoning test, then technical, then HR.', 'Focus on basics: one language, OOP, DBMS and SQL, simple coding.', 'Clear communication and flexibility (location, shifts) matter a lot.'] },
      { heading: 'Product companies', points: ['Deeper problem solving: data structures, algorithms, complexity.', 'Expect follow-ups that change the problem.', 'Project deep-dives: what YOU built, decided and learned.'] },
      { heading: 'Startups', points: ['Practical skills: can you build and ship something real?', 'Ownership and learning speed often matter more than polish.'] },
    ],
  },
  {
    id: 'tell-me-about-yourself',
    title: 'About yourself',
    tint: 'peach',
    icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
    slides: [
      { heading: 'Present, past, future (60 to 90 seconds)', points: ['Present: who you are now ("final-year CSE student who loves building web apps").', 'Past: 1 or 2 highlights (a project, an internship, an achievement).', 'Future: why this role, and what you want to learn.'] },
      { heading: 'Avoid', points: ['Reading out your resume line by line.', 'Family details or your whole life story.', 'Going past two minutes.'] },
    ],
  },
  {
    id: 'star-method',
    title: 'STAR answers',
    tint: 'sage',
    icon: 'M12 3l2.6 5.6L20 9.5l-4 4 1 5.7-5-2.8-5 2.8 1-5.7-4-4 5.4-.9z',
    slides: [
      { heading: 'For "Tell me about a time when…"', points: ['Situation: set the scene in one or two lines.', 'Task: what you had to achieve.', 'Action: what YOU did (say "I", not only "we").', 'Result: what happened, ideally with a number, and what you learned.'] },
      { heading: 'Prepare 4 stories in advance', points: ['A challenge you solved.', 'A conflict or disagreement in a team.', 'A mistake and what you learned.', 'Something you\'re proud of.'] },
    ],
  },
  {
    id: 'your-project',
    title: 'Your project',
    tint: 'blush',
    icon: 'M4 6h16v12H4zM8 10l-2 2 2 2M16 10l2 2-2 2',
    slides: [
      { heading: 'Explain your project like a story', points: ['The problem it solves, in one sentence.', 'Your role and the parts you built yourself.', 'One tough bug or decision, and how you handled it.', 'What you\'d improve with more time.'] },
      { heading: 'Expect "why" questions', points: ['Why this database, framework or approach?', 'What were the trade-offs?', 'Be honest about what you copied or learned from tutorials.'] },
    ],
  },
  {
    id: 'dont-know',
    title: 'Don\'t know?',
    tint: 'lavender',
    icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01',
    slides: [
      { heading: 'When you don\'t know the answer', points: ['Don\'t freeze and don\'t bluff.', 'Say what you DO know that\'s related.', 'Reason towards an answer out loud.', '"I haven\'t used that, but I\'d expect it works like…" is honest and smart.'] },
    ],
  },
  {
    id: 'common-mistakes',
    title: 'Common mistakes',
    tint: 'peach',
    icon: 'M12 8v5M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
    slides: [
      { heading: 'Easy points students often lose', points: ['Jumping into code without understanding the question.', 'Answering a different question than the one asked.', 'Long answers with no structure.', 'Saying "I know Java" but not being able to explain basics.'] },
      { heading: 'Simple fixes', points: ['Repeat the question in your own words first.', 'Give the short answer, then the details.', 'Only list skills on your resume you can be questioned on.'] },
    ],
  },
  {
    id: 'night-before',
    title: 'Night before',
    tint: 'sky',
    icon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z',
    slides: [
      { heading: 'Night-before checklist', points: ['Re-read your resume and project details.', 'Prepare 2 or 3 questions to ask them.', 'Test your camera, mic and internet for online rounds.', 'Keep ID, resume copies and charger ready.', 'Sleep. A rested brain answers better than a crammed one.'] },
      { heading: 'Morning of', points: ['Eat something, and arrive or log in 10 minutes early.', 'Do one easy warm-up question.', 'Breathe in for 4, hold for 4, out for 4. Repeat three times.'] },
    ],
  },
  {
    id: 'hr-round',
    title: 'HR round',
    tint: 'sage',
    icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
    slides: [
      { heading: 'HR questions you\'ll almost always hear', points: ['Tell me about yourself.', 'Strengths and weaknesses.', 'Why this company? Why should we hire you?', 'Are you open to relocation, shifts or a service agreement?'] },
      { heading: 'Weakness answers that work', points: ['Pick a real but non-critical weakness.', 'Show what you\'re actively doing to improve it.', 'Avoid "I\'m a perfectionist" without any example.'] },
      { heading: 'Salary questions (freshers)', points: ['Campus offers usually have a fixed package, so it\'s fine to say you\'re aligned with it.', 'Off-campus: research the typical range first and give a range, not a single number.'] },
    ],
  },
]
