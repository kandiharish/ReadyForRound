// Shapes of the data our backend sends. Must match server/src/catalog.ts and routes/profile.ts.

export type Option = { id: string; label: string; description?: string }
export type RoleOption = Option & { description: string; skills: string[] }

export type RoundId = 'technical' | 'project' | 'behavioural' | 'hr'

export type Catalog = {
  roles: RoleOption[]
  experienceLevels: Option[]
  companyTypes: Option[]
  placementTimelines: Option[]
  rounds: (Option & { id: RoundId; description: string })[]
  completeSequences: Record<string, RoundId[]>
}

export type InterviewTurn = {
  seq: number
  round: RoundId
  question: string
  is_follow_up: boolean
  answer: string | null
  skipped: boolean
}

export type InterviewStatus = 'in_progress' | 'completed' | 'ended_early'

export type Interview = {
  id: string
  mode: 'single' | 'complete'
  rounds: RoundId[]
  current_round_index: number
  status: InterviewStatus
  questionsPerRound: number
  created_at: string
  completed_at: string | null
  turns: InterviewTurn[]
}

export type QuestionFeedback = {
  seq: number
  round: RoundId
  question: string
  skipped: boolean
  score: number | null
  skill: string | null
  wentWell: string
  missing: string[]
  betterAnswer: string
  confidence: 'high' | 'medium' | 'low'
}

export type Report = {
  overallScore: number | null
  summary: string
  strengths: string[]
  improvements: string[]
  studyNext: { topic: string; why: string }[]
  questions: QuestionFeedback[]
  answeredCount: number
  skippedCount: number
}

export type ReportResponse =
  | { status: 'generating' | 'failed' | 'empty' }
  | { status: 'ready'; report: Report }

export type InterviewSummary = Pick<Interview, 'id' | 'mode' | 'rounds' | 'status' | 'created_at' | 'completed_at'>

export type UserSkill = {
  skill: string
  self_rating: number
  proven_score: number | null
}

export type Goal = {
  id: string
  target_role: string
  company_type: string
  experience_level: string
  target_date: string | null
  status: 'active' | 'achieved' | 'archived'
  created_at: string
  finished_at: string | null
}

export type GoalWithStats = Goal & { interviews: number; readiness: number | null; startedAt: number | null }

export type SessionSummary = {
  id: string
  goal_id: string | null
  mode: 'single' | 'complete'
  rounds: RoundId[]
  status: InterviewStatus
  created_at: string
  completed_at: string | null
  reportStatus: 'generating' | 'ready' | 'failed' | null
  score: number | null
}

export type HomeStats = {
  goal: Goal | null
  readiness: { score: number | null; delta: number | null; graded: number }
  roundScores: { round: RoundId; score: number | null }[]
  recommendation: { mode: 'single' | 'complete'; round?: RoundId; reason: string }
  streak: { days: number; week: { date: string; done: boolean; isToday: boolean }[] }
  daysLeft: number | null
  inProgress: SessionSummary | null
  recent: SessionSummary[]
  counts: { total: number; thisWeek: number }
  skills: UserSkill[]
}

export type Profile = {
  active_goal: Goal | null
  id: string
  full_name: string | null
  role: string
  target_role: string | null
  experience_level: string | null
  target_company_type: string | null
  placement_timeline: string | null
  speaking_pace: 'slow' | 'normal'
  practice_without_score: boolean
  onboarding_completed: boolean
  user_skills: UserSkill[]
}
