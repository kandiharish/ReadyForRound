import { config } from './config.js'
import { supabase } from './db/supabase.js'
import { logError } from './errors.js'
import { GROUPS } from './skillsData.js'

// Job Market: real job ads from Adzuna (India), summarised once a day and saved,
// so students' pages read saved numbers (fast, and well within Adzuna's free limits).

// What we search for on Adzuna for each of our roles.
export const ROLE_SEARCH: Record<string, string> = {
  sde: 'software engineer',
  frontend: 'frontend developer',
  backend: 'backend developer',
  fullstack: 'full stack developer',
  fde: 'forward deployed engineer',
  ai_engineer: 'machine learning engineer',
  data_scientist: 'data scientist',
  data_engineer: 'data engineer',
  data_analyst: 'data analyst',
  devops: 'devops engineer',
  mobile: 'mobile app developer',
  qa: 'qa automation engineer',
  cybersecurity: 'cyber security analyst',
}

export type Ad = {
  title?: string
  description?: string
  company?: { display_name?: string }
  location?: { display_name?: string; area?: string[] }
  salary_min?: number
  salary_max?: number
  salary_is_predicted?: string | number
  created?: string
  redirect_url?: string
}

export type Snapshot = {
  role_id: string
  total_openings: number // all matching ads in the last 30 days (Adzuna's count)
  sample_size: number // ads we actually read
  salary: { p25: number; p50: number; p75: number; count: number } | null // yearly INR, from ads that state a salary
  fresher_share: number | null // 0..1 of sampled ads open to freshers
  cities: { name: string; share: number }[]
  companies: { name: string; count: number }[]
  skills: { skill: string; share: number }[] // share of sampled ads that mention the skill
}

// ---------- Skill matching ----------
// Words that are skills but also everyday English, so we only count them in safer forms.
const AMBIGUOUS = new Set(['c', 'r', 'go', 'swift', 'rust', 'dart', 'ada', 'move', 'elm', 'hack', 'sed', 'scheme', 'nim', 'crystal', 'julia',
  'communication', 'teamwork', 'leadership', 'creativity', 'adaptability', 'negotiation', 'mentoring', 'debugging', 'agile', 'scrum'])
const SAFE_FORMS: Record<string, RegExp> = {
  go: /\b(golang|go lang|go developer|go\/)\b/i,
  c: /\b(c\/c\+\+|c programming|embedded c)\b/i,
  r: /\b(r programming|r studio|rstudio|r\/python|python\/r)\b/i,
  swift: /\b(swift ?ui|ios.{0,20}swift|swift.{0,20}ios)\b/i,
  rust: /\brust (developer|programming|language)\b/i,
}
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

type Matcher = { name: string; test: (text: string) => boolean }
export const SKILL_MATCHERS: Matcher[] = (() => {
  const out: Matcher[] = []
  const seen = new Set<string>()
  for (const items of Object.values(GROUPS)) {
    for (const item of items) {
      const [name, aliases = ''] = item.split('|')
      if (seen.has(name.toLowerCase())) continue
      seen.add(name.toLowerCase())
      const key = name.toLowerCase()
      if (SAFE_FORMS[key]) { out.push({ name, test: (t) => SAFE_FORMS[key].test(t) }); continue }
      if (AMBIGUOUS.has(key)) continue
      // Name and aliases, matched as whole words (aliases of 1-2 letters like "js" or "py" are too noisy)
      const forms = [name, ...aliases.split(',').filter((a) => a.trim().length > 2)].map((f) => escape(f.trim()))
      const re = new RegExp(`(^|[^a-z0-9+#])(${forms.join('|')})(?![a-z0-9+#])`, 'i')
      out.push({ name, test: (t) => re.test(t) })
    }
  }
  return out
})()

// Soft skills and generic practices aren't useful "skills to learn" for a role
const NOT_TECH = new Set(['Problem Solving', 'Critical Thinking', 'Time Management', 'Presentation Skills', 'Public Speaking', 'Attention to Detail',
  'Analytical Thinking', 'Decision Making', 'Conflict Resolution', 'Stakeholder Management', 'Customer Handling', 'English Proficiency',
  'Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Code Review', 'Pair Programming', 'Technical Documentation', 'Clean Code', 'Troubleshooting'])

// ---------- Summarising a sample of ads ----------
const FRESHER = /\b(fresher|freshers|entry[- ]level|graduate trainee|trainee|intern(ship)?|0\s*(-|to)\s*[12]\s*(yrs?|years?)|campus|junior)\b/i
const SENIOR = /\b([3-9]|1[0-9])\s*\+?\s*(-|to)?\s*(\d+\s*)?(yrs?|years?)\b|\b(senior|sr\.?|lead|principal|staff|manager|architect)\b/i

const percentile = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)))]

export function summarise(roleId: string, ads: Ad[], totalOpenings: number): Snapshot {
  const n = ads.length
  // Salary: only ads that state a real (not predicted) yearly salary in a believable range
  const salaries = ads
    .filter((a) => String(a.salary_is_predicted ?? '1') === '0' && (a.salary_min || a.salary_max))
    .map((a) => ((a.salary_min ?? a.salary_max!) + (a.salary_max ?? a.salary_min!)) / 2)
    .filter((s) => s >= 100_000 && s <= 20_000_000)
    .sort((x, y) => x - y)
  const salary = salaries.length >= 8
    ? { p25: Math.round(percentile(salaries, 0.25)), p50: Math.round(percentile(salaries, 0.5)), p75: Math.round(percentile(salaries, 0.75)), count: salaries.length }
    : null

  // Freshers: ads that mention entry-level signals and not senior ones
  const text = (a: Ad) => `${a.title ?? ''} ${a.description ?? ''}`
  const fresher = ads.filter((a) => FRESHER.test(text(a)) && !SENIOR.test(a.title ?? '')).length
  const fresher_share = n >= 10 ? Math.round((fresher / n) * 100) / 100 : null

  // Cities: the second level of Adzuna's location area is usually the state; the most specific part is the city
  const cityCount = new Map<string, number>()
  for (const a of ads) {
    const area = a.location?.area ?? []
    const city = (area[area.length - 1] ?? a.location?.display_name ?? '').split(',')[0].trim()
    if (city && city.toLowerCase() !== 'india') cityCount.set(city, (cityCount.get(city) ?? 0) + 1)
  }
  const cities = [...cityCount.entries()].sort((x, y) => y[1] - x[1]).slice(0, 6).map(([name, c]) => ({ name, share: Math.round((c / n) * 100) / 100 }))

  // Companies (names only)
  const companyCount = new Map<string, number>()
  for (const a of ads) {
    const c = a.company?.display_name?.trim()
    if (c) companyCount.set(c, (companyCount.get(c) ?? 0) + 1)
  }
  const companies = [...companyCount.entries()].sort((x, y) => y[1] - x[1]).slice(0, 8).map(([name, count]) => ({ name, count }))

  // Skills: share of ads that mention each skill
  const skillCount = new Map<string, number>()
  for (const a of ads) {
    const t = text(a)
    for (const m of SKILL_MATCHERS) if (!NOT_TECH.has(m.name) && m.test(t)) skillCount.set(m.name, (skillCount.get(m.name) ?? 0) + 1)
  }
  const skills = [...skillCount.entries()]
    .filter(([, c]) => c >= Math.max(2, n * 0.04))
    .sort((x, y) => y[1] - x[1]).slice(0, 15)
    .map(([skill, c]) => ({ skill, share: Math.round((c / n) * 100) / 100 }))

  return { role_id: roleId, total_openings: totalOpenings, sample_size: n, salary, fresher_share, cities, companies, skills }
}

// ---------- Fetching from Adzuna ----------
const PAGES = 2 // 2 pages x 50 ads per role, 26 calls a day in total
async function fetchRole(roleId: string): Promise<Snapshot> {
  const ads: Ad[] = []
  let total = 0
  for (let page = 1; page <= PAGES; page++) {
    const url = new URL(`https://api.adzuna.com/v1/api/jobs/in/search/${page}`)
    url.search = new URLSearchParams({
      app_id: config.ADZUNA_APP_ID!, app_key: config.ADZUNA_APP_KEY!,
      what_phrase: ROLE_SEARCH[roleId], max_days_old: '30', results_per_page: '50', 'content-type': 'application/json',
    }).toString()
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) })
    if (!res.ok) throw new Error(`Adzuna ${res.status} for ${roleId}: ${(await res.text()).slice(0, 200)}`)
    const body = await res.json() as { count?: number; results?: Ad[] }
    total = body.count ?? total
    ads.push(...(body.results ?? []))
    if ((body.results ?? []).length < 50) break
  }
  return summarise(roleId, ads, total)
}

let refreshing: Promise<void> | null = null

// Fetch every role and save today's snapshot. One refresh at a time.
export function refreshMarket() {
  if (!config.ADZUNA_APP_ID || !config.ADZUNA_APP_KEY || !supabase) return Promise.resolve()
  refreshing ??= (async () => {
    const today = new Date().toISOString().slice(0, 10)
    for (const roleId of Object.keys(ROLE_SEARCH)) {
      try {
        const snap = await fetchRole(roleId)
        await supabase!.from('market_snapshots').upsert({ ...snap, fetched_on: today, fetched_at: new Date().toISOString() }, { onConflict: 'role_id,fetched_on' })
      } catch (err) {
        logError('server', err as Error, { path: `market refresh ${roleId}` })
      }
    }
  })().finally(() => { refreshing = null })
  return refreshing
}

// Latest snapshot per role, plus how openings changed since about a month ago.
export async function getMarket() {
  const configured = !!(config.ADZUNA_APP_ID && config.ADZUNA_APP_KEY)
  const { data } = await supabase!.from('market_snapshots').select('*').order('fetched_on', { ascending: false }).limit(13 * 40)
  const rows = data ?? []
  const latest = new Map<string, (typeof rows)[number]>()
  for (const r of rows) if (!latest.has(r.role_id)) latest.set(r.role_id, r)

  // Refresh in the background once a day (Render's free server sleeps, so a timer can't be relied on).
  const newest = rows[0]?.fetched_at ? new Date(rows[0].fetched_at).getTime() : 0
  if (configured && Date.now() - newest > 24 * 3_600_000) void refreshMarket()

  const roles = [...latest.values()].map((r) => {
    const history = rows.filter((h) => h.role_id === r.role_id).map((h) => ({ date: h.fetched_on as string, openings: h.total_openings as number })).reverse()
    const monthAgo = history.find((h) => Date.parse(r.fetched_on) - Date.parse(h.date) >= 25 * 86_400_000)
    const trend = monthAgo && monthAgo.openings > 0 ? Math.round(((r.total_openings - monthAgo.openings) / monthAgo.openings) * 100) : null
    return { ...r, trend, history }
  })
  return { configured, updatedAt: rows[0]?.fetched_at ?? null, source: 'Adzuna (job ads in India, last 30 days)', roles }
}
