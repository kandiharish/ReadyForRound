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

export type InterviewSummary = Pick<Interview, 'id' | 'mode' | 'rounds' | 'status' | 'created_at' | 'completed_at'>

export type UserSkill = {
  skill: string
  self_rating: number
  proven_score: number | null
}

export type Profile = {
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
