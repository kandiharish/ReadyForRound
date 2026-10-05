// Career Compass: finds the tech roles that fit how someone likes to work.
// Plain rules, not AI: instant, free, explainable, and the same answers always give the same result.
// Role names are never shown while answering, so people react to the WORK, not to hype.

export const DIMENSIONS = {
  visual: 'Visual design & UI',
  logic: 'Logic & problem solving',
  build: 'Building products end to end',
  data: 'Data & analysis',
  ai: 'Maths & AI',
  systems: 'Systems & infrastructure',
  security: 'Security',
  quality: 'Quality & detail',
  people: 'People & communication',
  mobile: 'Mobile apps',
} as const
export type Dim = keyof typeof DIMENSIONS
const DIMS = Object.keys(DIMENSIONS) as Dim[]
type Weights = Partial<Record<Dim, number>>

// ---------- Part 1: would you enjoy this? (1-5) ----------
export const INTEREST_CARDS: { id: string; text: string; dims: Weights }[] = [
  { id: 'i1', text: 'Turn a design into a smooth, pixel-perfect screen people love using', dims: { visual: 2 } },
  { id: 'i2', text: 'Crack a tricky puzzle, like finding the fastest route between 100 cities', dims: { logic: 2 } },
  { id: 'i3', text: 'Build a small app from an empty folder until it fully works', dims: { build: 2 } },
  { id: 'i4', text: 'Dig through a huge spreadsheet to find out why sales suddenly dropped', dims: { data: 2 } },
  { id: 'i5', text: 'Tweak a model again and again until its predictions get more accurate', dims: { ai: 2, data: 1 } },
  { id: 'i6', text: 'Set up servers so an app stays online even when traffic suddenly spikes', dims: { systems: 2 } },
  { id: 'i7', text: 'Try to break into a website (with permission) to find its weak spots', dims: { security: 2 } },
  { id: 'i8', text: 'Hunt down a bug that nobody else could reproduce', dims: { quality: 2, logic: 1 } },
  { id: 'i9', text: "Sit with a client, understand their problem and turn it into a plan", dims: { people: 2 } },
  { id: 'i10', text: 'Decide how an app should look and feel in someone\'s hand', dims: { mobile: 2, visual: 1 } },
  { id: 'i11', text: 'Automate a boring task so nobody ever has to do it by hand again', dims: { systems: 1, build: 1 } },
  { id: 'i12', text: 'Make a dashboard that helps a manager take a better decision', dims: { data: 1, people: 1 } },
]

// ---------- Part 2: this or that? ----------
export const PAIRS: { id: string; a: { text: string; dims: Weights }; b: { text: string; dims: Weights } }[] = [
  { id: 'p1', a: { text: 'Make a page look beautiful', dims: { visual: 2 } }, b: { text: 'Make a slow query 10× faster', dims: { logic: 1, data: 1 } } },
  { id: 'p2', a: { text: 'Talk with users to understand a problem', dims: { people: 2 } }, b: { text: 'Work alone, deep in the code', dims: { logic: 1, build: 1 } } },
  { id: 'p3', a: { text: 'Find hidden patterns in numbers', dims: { data: 2 } }, b: { text: 'Build features people click every day', dims: { build: 2 } } },
  { id: 'p4', a: { text: 'Keep a system safe from attackers', dims: { security: 2 } }, b: { text: 'Ship new features quickly', dims: { build: 2 } } },
  { id: 'p5', a: { text: 'Teach a computer to make predictions', dims: { ai: 2 } }, b: { text: 'Design how data is stored and moved', dims: { data: 1, systems: 1 } } },
  { id: 'p6', a: { text: 'Write tests that catch bugs before users do', dims: { quality: 2 } }, b: { text: 'Write the feature itself', dims: { build: 2 } } },
  { id: 'p7', a: { text: 'Automate deployments and monitoring', dims: { systems: 2 } }, b: { text: 'Polish animations and layout', dims: { visual: 2 } } },
  { id: 'p8', a: { text: 'Present your findings in a meeting', dims: { people: 2 } }, b: { text: 'Optimise an algorithm', dims: { logic: 2 } } },
  { id: 'p9', a: { text: 'Build an app for phones', dims: { mobile: 2 } }, b: { text: 'Build a pipeline that processes millions of records', dims: { data: 1, systems: 1 } } },
  { id: 'p10', a: { text: 'Learn the maths behind how AI works', dims: { ai: 2 } }, b: { text: 'Learn how hackers attack systems', dims: { security: 2 } } },
]
export type PairAnswer = 'a' | 'b' | 'both'

// ---------- Part 3: what have you actually done? ----------
export const EXPERIENCES: { id: string; text: string; dims: Weights }[] = [
  { id: 'e1', text: 'Built a website or web page', dims: { visual: 1, build: 1 } },
  { id: 'e2', text: 'Built a backend or API', dims: { build: 1, systems: 1, logic: 1 } },
  { id: 'e3', text: 'Analysed data in Excel, SQL or Python', dims: { data: 2 } },
  { id: 'e4', text: 'Trained a machine learning model or built with an AI API', dims: { ai: 2 } },
  { id: 'e5', text: 'Set up a server, cloud account or Docker', dims: { systems: 2 } },
  { id: 'e6', text: 'Built a mobile app', dims: { mobile: 2, build: 1 } },
  { id: 'e7', text: 'Tested software or found bugs for others', dims: { quality: 2 } },
  { id: 'e8', text: 'Did a security challenge (CTF) or found a vulnerability', dims: { security: 2 } },
  { id: 'e9', text: 'Explained something technical to non-technical people', dims: { people: 2 } },
  { id: 'e10', text: 'Solved DSA or competitive programming problems', dims: { logic: 2 } },
]
export type Experience = 'none' | 'disliked' | 'ok' | 'loved'
const EXPERIENCE_VALUE: Record<Experience, number> = { none: 0, disliked: -1.5, ok: 0.5, loved: 2 }

// ---------- Part 4: comfort check (1-5) ----------
export const COMFORTS = [
  { id: 'maths', text: 'Maths and statistics', low: 'Drains me', high: 'I enjoy it' },
  { id: 'coding', text: 'Coding for most of the day', low: 'Not for me', high: 'Love it' },
  { id: 'people', text: 'Talking to clients and presenting', low: 'Drains me', high: 'Energises me' },
  { id: 'detail', text: 'Careful, repetitive checking', low: 'Boring', high: 'Satisfying' },
] as const
export type ComfortId = (typeof COMFORTS)[number]['id']

// ---------- Part 5: taste tests (optional) ----------
export const TASTE_TESTS = [
  {
    id: 't1', title: 'Spot the bug', dims: { logic: 1, quality: 1 } as Weights,
    prompt: 'This function should add up every number in a list. Which line is wrong?',
    code: 'function sum(nums) {\n  let total = 0\n  for (let i = 1; i < nums.length; i++) {\n    total += nums[i]\n  }\n  return total\n}',
    options: ['Line 2: total should start at 1', 'Line 3: the loop should start at 0', 'Line 4: it should be -=', 'Nothing is wrong'],
    answer: 1,
  },
  {
    id: 't2', title: 'Read the chart', dims: { data: 2 } as Weights,
    prompt: 'Monthly app sign-ups. Which month had the biggest drop compared with the month before?',
    chart: [['Jan', 420], ['Feb', 460], ['Mar', 300], ['Apr', 340], ['May', 320]] as [string, number][],
    options: ['February', 'March', 'April', 'May'],
    answer: 1,
  },
  {
    id: 't3', title: 'Pick the better design', dims: { visual: 2 } as Weights,
    prompt: 'Which sign-up card is easier to read and use?',
    options: ['Card A', 'Card B'],
    answer: 1,
  },
  {
    id: 't4', title: 'Find the weakness', dims: { security: 2 } as Weights,
    prompt: 'A login page builds its database query like this. What is the risk?',
    code: 'query = "SELECT * FROM users WHERE name = \'" + userInput + "\'"',
    options: ['The page will load slowly', 'An attacker can inject their own SQL', 'The password is shown on screen', 'There is no risk'],
    answer: 1,
  },
  {
    id: 't5', title: 'Fix the outage', dims: { systems: 2 } as Weights,
    prompt: 'Your website becomes very slow every evening at 7 PM. What do you check first?',
    options: ['Redesign the home page', 'Server and database load at 7 PM', 'Rewrite the app in a new language', 'Ask users to visit later'],
    answer: 1,
  },
] as const
export type TasteAnswer = { choice: number | null; enjoyed: number } // enjoyed 1-5

export type CompassAnswers = {
  interests: Record<string, number> // card id -> 1..5
  pairs: Record<string, PairAnswer>
  experiences: Record<string, Experience>
  comfort: Record<ComfortId, number> // 1..5
  taste: Record<string, TasteAnswer> // optional
}

// ---------- Roles: how much each one uses each dimension (0-3) ----------
export const ROLE_PROFILES: Record<string, Weights> = {
  sde: { logic: 3, build: 2, systems: 1, quality: 1 },
  frontend: { visual: 3, build: 2, quality: 1, people: 1 },
  backend: { logic: 2, systems: 2, build: 2, data: 1 },
  fullstack: { build: 3, visual: 1, logic: 1, systems: 1 },
  fde: { people: 3, build: 2, systems: 1, logic: 1 },
  ai_engineer: { ai: 3, logic: 2, data: 2, build: 1 },
  data_scientist: { data: 3, ai: 2, logic: 1, people: 1 },
  data_engineer: { data: 2, systems: 3, logic: 2 },
  data_analyst: { data: 3, people: 2, quality: 1 },
  devops: { systems: 3, quality: 2, security: 1 },
  mobile: { mobile: 3, build: 2, visual: 1, quality: 1 },
  qa: { quality: 3, logic: 1, security: 1 },
  cybersecurity: { security: 3, systems: 2, logic: 1 },
}

// Practical needs: if someone is uncomfortable with these, the role is marked down and we say why.
const NEEDS: Record<string, { comfort: ComfortId; why: string }[]> = {
  ai_engineer: [{ comfort: 'maths', why: 'it needs a lot of maths and statistics' }, { comfort: 'coding', why: 'it involves a lot of coding' }],
  data_scientist: [{ comfort: 'maths', why: 'it is built on statistics and probability' }],
  sde: [{ comfort: 'coding', why: 'you would be coding most of the day' }],
  backend: [{ comfort: 'coding', why: 'you would be coding most of the day' }],
  fullstack: [{ comfort: 'coding', why: 'you would be coding most of the day' }],
  data_engineer: [{ comfort: 'coding', why: 'it is mostly coding pipelines' }],
  fde: [{ comfort: 'people', why: 'you would work directly with customers every day' }],
  data_analyst: [{ comfort: 'people', why: 'you would present findings to managers often' }],
  qa: [{ comfort: 'detail', why: 'it is careful, detailed checking every day' }],
}

export const DAY_IN_ROLE: Record<string, string> = {
  sde: 'Solve problems in code: design features, write and review code, fix bugs and make things faster and more reliable.',
  frontend: 'Turn designs into fast, accessible screens, polish interactions and make sure the app works on every device.',
  backend: 'Build the APIs and databases behind apps: data models, business logic, performance and reliability.',
  fullstack: 'Build features end to end, from the screen the user sees to the server and database behind it.',
  fde: 'Work with customers to understand their problems, then build, integrate and deploy software on site to solve them.',
  ai_engineer: 'Build products with machine learning and LLMs: prepare data, train or prompt models, evaluate and ship them.',
  data_scientist: 'Explore data, test ideas with statistics and build models that predict or explain what will happen.',
  data_engineer: 'Build pipelines that collect, clean and move data so analysts and AI teams can trust and use it.',
  data_analyst: 'Answer business questions with SQL, spreadsheets and dashboards, then explain the findings to decision makers.',
  devops: 'Automate how software is built and deployed, run cloud infrastructure and keep systems fast and online.',
  mobile: 'Build Android and iOS apps: smooth screens, offline behaviour, device features and app store releases.',
  qa: 'Design tests, automate them and find bugs before users do, so every release is reliable.',
  cybersecurity: 'Protect systems by finding weaknesses, monitoring threats and responding when something goes wrong.',
}

export type CompassResult = {
  version: 1
  dims: Record<Dim, number> // 0-100, how much each kind of work fits
  matches: { role: string; percent: number; reasons: string[]; concerns: string[] }[] // best first, all 13
  confidence: 'high' | 'medium' | 'low'
  notes: string[] // honest observations (e.g. hype check, "you liked almost everything")
}

// ---------- Scoring ----------
export function scoreCompass(a: CompassAnswers): CompassResult {
  const raw = Object.fromEntries(DIMS.map((d) => [d, 0])) as Record<Dim, number>
  const evidence = Object.fromEntries(DIMS.map((d) => [d, [] as { weight: number; text: string }[]])) as Record<Dim, { weight: number; text: string }[]>
  const add = (dims: Weights, amount: number, text?: string) => {
    for (const [d, w] of Object.entries(dims) as [Dim, number][]) {
      raw[d] += w * amount
      if (text && amount > 0) evidence[d].push({ weight: w * amount, text })
    }
  }

  // Part 1: interest ratings, centred so "neutral" adds nothing (weight 1)
  for (const c of INTEREST_CARDS) {
    const r = a.interests[c.id]
    if (r) add(c.dims, (r - 3) * 1, r >= 4 ? `You'd enjoy: "${c.text}"` : undefined)
  }
  // Part 2: forced choices (weight 1.2: choosing reveals priorities)
  for (const p of PAIRS) {
    const v = a.pairs[p.id]
    if (v === 'a') add(p.a.dims, 1.2, `You chose "${p.a.text}" over "${p.b.text}"`)
    else if (v === 'b') add(p.b.dims, 1.2, `You chose "${p.b.text}" over "${p.a.text}"`)
    else if (v === 'both') { add(p.a.dims, 0.4); add(p.b.dims, 0.4) }
  }
  // Part 3: real experience counts more than imagination (weight 1.5)
  for (const e of EXPERIENCES) {
    const v = a.experiences[e.id] ?? 'none'
    add(e.dims, EXPERIENCE_VALUE[v] * 1.5, v === 'loved' ? `You loved it when you did this: "${e.text}"` : undefined)
  }
  // Part 5: enjoying a real task is the strongest signal (weight 2)
  for (const t of TASTE_TESTS) {
    const ans = a.taste[t.id]
    if (ans) add(t.dims, (ans.enjoyed - 3) * 2, ans.enjoyed >= 4 ? `You enjoyed the "${t.title}" task` : undefined)
  }

  // Dimension scores 0-100, relative to this person's own range
  const values = DIMS.map((d) => raw[d])
  const min = Math.min(...values), max = Math.max(...values)
  const span = max - min || 1
  const dims = Object.fromEntries(DIMS.map((d) => [d, Math.round(((raw[d] - min) / span) * 100)])) as Record<Dim, number>

  // Role match: how closely the person's strongest areas line up with what the role needs (cosine similarity).
  const vec = DIMS.map((d) => Math.max(0, raw[d] - min))
  const norm = (v: number[]) => Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1
  const matches = Object.entries(ROLE_PROFILES).map(([role, profile]) => {
    const rv = DIMS.map((d) => profile[d] ?? 0)
    let sim = vec.reduce((s, x, i) => s + x * rv[i], 0) / (norm(vec) * norm(rv))
    const concerns: string[] = []
    for (const need of NEEDS[role] ?? []) {
      const c = a.comfort[need.comfort]
      if (c && c <= 2) { sim *= 0.8; concerns.push(`You said "${COMFORTS.find((x) => x.id === need.comfort)!.text.toLowerCase()}" ${c === 1 ? 'really drains you' : "isn't for you"}, and ${need.why}.`) }
    }
    const top = (Object.entries(profile) as [Dim, number][]).sort((x, y) => y[1] - x[1]).slice(0, 2).map(([d]) => d)
    const reasons = top.flatMap((d) => evidence[d].sort((x, y) => y.weight - x.weight).slice(0, 2).map((e) => e.text))
    return { role, percent: Math.round(Math.max(0, sim) * 100), reasons: [...new Set(reasons)].slice(0, 3), concerns }
  }).sort((x, y) => y.percent - x.percent)

  // Honesty checks
  const notes: string[] = []
  const ratings = Object.values(a.interests)
  const avg = ratings.reduce((s, r) => s + r, 0) / (ratings.length || 1)
  const variance = ratings.reduce((s, r) => s + (r - avg) ** 2, 0) / (ratings.length || 1)
  if (avg >= 4.2 && variance < 0.6) notes.push('You rated almost everything highly. That is great curiosity, but the result is less certain: try the taste tests and a drill in your top roles to see what you really enjoy.')
  if (avg <= 2 && variance < 0.6) notes.push("You rated most tasks low. That's okay: you might not have tried them yet. Building one small project in a top role will tell you more.")
  if ((a.interests.i5 ?? 0) >= 4 && (a.comfort.maths ?? 3) <= 2) notes.push('You like the idea of working on AI, but said maths drains you. AI work is heavy on statistics, so try a short AI drill before deciding.')
  const tried = EXPERIENCES.filter((e) => (a.experiences[e.id] ?? 'none') !== 'none').length
  if (tried <= 1) notes.push("You haven't tried many of these yet, so this is based mostly on what you imagine enjoying. Retake it after building a couple of small projects.")

  const gap = matches[0].percent - matches[2].percent
  const confidence: CompassResult['confidence'] = notes.length >= 2 || gap < 4 ? 'low' : gap < 10 || notes.length === 1 ? 'medium' : 'high'
  return { version: 1, dims, matches, confidence, notes }
}
