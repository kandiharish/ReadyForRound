// Run: npm run compass:sim  (checks Career Compass still points simulated students to their real role)
// Simulated students: for each true role, answer like someone who fits it (with noise), then check the match.
import { COMFORTS, EXPERIENCES, INTEREST_CARDS, PAIRS, ROLE_PROFILES, scoreCompass, type CompassAnswers, type Dim } from '../../client/src/lib/compass.ts'

let seed = 42
const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296 }
const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd())

const roles = Object.keys(ROLE_PROFILES)
const affinity = (profile: Partial<Record<Dim, number>>, dims: Partial<Record<Dim, number>>) =>
  Object.entries(dims).reduce((s, [d, w]) => s + (profile[d as Dim] ?? 0) * (w ?? 0), 0)

const N = 200
let top1 = 0, top3 = 0
const confusion: Record<string, Record<string, number>> = {}
for (const truth of roles) {
  const prof = ROLE_PROFILES[truth]
  let t1 = 0
  for (let n = 0; n < N; n++) {
    const a: CompassAnswers = { interests: {}, pairs: {}, experiences: {}, comfort: {} as never, taste: {} }
    for (const c of INTEREST_CARDS) a.interests[c.id] = Math.max(1, Math.min(5, Math.round(2.4 + affinity(prof, c.dims) * 0.45 + gauss() * 0.9)))
    for (const p of PAIRS) {
      const d = affinity(prof, p.a.dims) - affinity(prof, p.b.dims) + gauss() * 1.6
      a.pairs[p.id] = Math.abs(d) < 0.5 ? 'both' : d > 0 ? 'a' : 'b'
    }
    for (const e of EXPERIENCES) {
      const f = affinity(prof, e.dims) + gauss() * 1.5
      a.experiences[e.id] = f > 4 ? 'loved' : f > 2 ? 'ok' : rnd() < 0.15 ? 'disliked' : 'none'
    }
    for (const c of COMFORTS) (a.comfort as Record<string, number>)[c.id] = Math.max(1, Math.min(5, Math.round(3.4 + gauss())))
    const r = scoreCompass(a)
    const ranked = r.matches.map((m) => m.role)
    if (ranked[0] === truth) { top1++; t1++ }
    if (ranked.slice(0, 3).includes(truth)) top3++
    confusion[truth] ??= {}
    confusion[truth][ranked[0]] = (confusion[truth][ranked[0]] ?? 0) + 1
  }
  const wrong = Object.entries(confusion[truth]).filter(([k]) => k !== truth).sort((x, y) => y[1] - x[1]).slice(0, 2).map(([k, v]) => `${k} ${v}`).join(', ')
  console.log(truth.padEnd(18), `${Math.round((t1 / N) * 100)}%`.padStart(5), wrong ? `  confused with: ${wrong}` : '')
}
console.log(`\nTOP-1 ${(top1 / (N * roles.length) * 100).toFixed(1)}%   TOP-3 ${(top3 / (N * roles.length) * 100).toFixed(1)}%   (${roles.length} roles)`)
process.exit(0)
