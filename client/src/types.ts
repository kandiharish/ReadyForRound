// Shapes of the data our backend sends. Must match server/src/catalog.ts and routes/profile.ts.

export type Option = { id: string; label: string; description?: string }
export type RoleOption = Option & { description: string; skills: string[] }

export type Catalog = {
  roles: RoleOption[]
  experienceLevels: Option[]
  companyTypes: Option[]
  placementTimelines: Option[]
}

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
