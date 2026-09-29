// The four interview rounds and how a "complete interview" is put together.

export const ROUNDS = [
  {
    id: 'technical',
    label: 'Technical',
    description: 'Concepts and problem-solving for your role and skills.',
    goal:
      'Test understanding of core concepts for the role, focusing on the candidate\'s listed skills. ' +
      'Prefer "explain", "compare" and "what happens when" questions over trivia. ' +
      'Match difficulty to the experience level and company type.',
  },
  {
    id: 'project',
    label: 'Project deep-dive',
    description: 'Talk through a project you built and the choices you made.',
    goal:
      'Ask the candidate to describe a project they built, then dig into their own role, technical ' +
      'decisions, trade-offs, problems they hit and what they would do differently.',
  },
  {
    id: 'behavioural',
    label: 'Behavioural',
    description: 'Teamwork, challenges and how you handle situations.',
    goal:
      'Ask "tell me about a time..." questions about teamwork, conflict, failure, deadlines and ' +
      'learning. Look for specific situations, the candidate\'s own actions, and results (STAR).',
  },
  {
    id: 'hr',
    label: 'HR',
    description: 'About you, your goals and fit with the company.',
    goal:
      'Ask typical HR questions: introduce yourself, strengths and weaknesses, why this role, ' +
      'career goals, relocation and flexibility. Keep it friendly and professional.',
  },
] as const

export type RoundId = (typeof ROUNDS)[number]['id']
export const roundIds = ROUNDS.map((r) => r.id) as [RoundId, ...RoundId[]]

// Real interview drives differ by company type, so the complete interview does too.
export const COMPLETE_SEQUENCES: Record<string, RoundId[]> = {
  service: ['technical', 'hr'],
  product: ['technical', 'project', 'behavioural', 'hr'],
  startup: ['technical', 'project', 'behavioural'],
  any: ['technical', 'project', 'hr'],
}

// Main questions per round (follow-ups are extra, at most one per main question).
// Kept small so one interview fits comfortably in free AI limits.
export const QUESTIONS_PER_ROUND = { single: 5, complete: 3 } as const
export const MAX_FOLLOW_UPS_PER_QUESTION = 1

export function roundById(id: RoundId) {
  return ROUNDS.find((r) => r.id === id)!
}
