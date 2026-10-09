// Jobs Board data shapes and formatting, shared by the Jobs Board pages and their charts.

export type MarketRole = {
  role_id: string
  fetched_on: string
  total_openings: number
  sample_size: number
  salary: { p25: number; p50: number; p75: number; count: number } | null
  fresher_share: number | null
  cities: { name: string; share: number }[]
  companies: { name: string; count: number }[]
  skills: { skill: string; share: number }[]
  trend: number | null
  history: { date: string; openings: number }[]
}
export type Market = { configured: boolean; updatedAt: string | null; source: string; roles: MarketRole[] }

// ₹ in lakhs per year, the way Indian job ads talk about pay (e.g. "₹6.5L")
export const lakhs = (n: number) => `₹${(n / 100_000).toFixed(n >= 1_000_000 ? 0 : 1).replace(/\.0$/, '')}L`
export const num = (n: number) => n.toLocaleString('en-IN')
// 2,340 -> "2.3k"
export const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, '')}k` : `${Math.round(n)}`)

// Short role names for tight spaces (charts on phones)
export const SHORT_ROLE: Record<string, string> = {
  sde: 'SDE', frontend: 'Frontend', backend: 'Backend', fullstack: 'Full-Stack', fde: 'FDE', ai_engineer: 'AI / ML',
  data_scientist: 'Data Science', data_engineer: 'Data Eng.', data_analyst: 'Data Analyst', devops: 'DevOps',
  mobile: 'Mobile', qa: 'QA', cybersecurity: 'Security',
  vlsi_design: 'VLSI Design', vlsi_verification: 'VLSI Verif.', embedded: 'Embedded', electrical: 'Electrical',
  network_engineer: 'Network', pcb_design: 'PCB Design',
}

// Skills summed across roles, weighted by each role's openings: "about how many ads ask for this".
// Estimated, because skill shares come from the sample of ads we read for each role.
export function hotSkills(roles: MarketRole[]) {
  const agg = new Map<string, { skill: string; est: number; roles: { id: string; share: number }[] }>()
  for (const r of roles) {
    for (const s of r.skills) {
      const a = agg.get(s.skill) ?? { skill: s.skill, est: 0, roles: [] }
      a.est += s.share * r.total_openings
      a.roles.push({ id: r.role_id, share: s.share })
      agg.set(s.skill, a)
    }
  }
  return [...agg.values()]
    .map((a) => ({ ...a, roles: a.roles.sort((x, y) => y.share - x.share) }))
    .sort((x, y) => y.est - x.est)
}

// Cities across all roles, as a share of all openings
export function topCities(roles: MarketRole[]) {
  const total = roles.reduce((t, r) => t + r.total_openings, 0) || 1
  const agg = new Map<string, number>()
  for (const r of roles) for (const c of r.cities) agg.set(c.name, (agg.get(c.name) ?? 0) + c.share * r.total_openings)
  return [...agg.entries()].map(([name, n]) => ({ name, share: n / total })).sort((x, y) => y.share - x.share)
}
