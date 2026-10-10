import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router'
import { Icon, type IconName } from './ui'
import { compact, hotSkills, lakhs, num, SHORT_ROLE, topCities, type MarketRole } from '../lib/market'

// "Top charts" for the Jobs Board: the #1 in each category, then five small charts,
// drawn with plain CSS and SVG (no chart library) so the page stays light.

type Named = { roles: MarketRole[]; name: (id: string) => string }

// Long role name on wide screens, short one on phones
function RoleName({ id, name }: { id: string; name: (id: string) => string }) {
  return <><span className="sm:hidden">{SHORT_ROLE[id] ?? name(id)}</span><span className="hidden sm:inline">{name(id)}</span></>
}

// Bars grow from zero when a chart first appears
function useGrow() {
  const [grown, setGrown] = useState(false)
  useEffect(() => {
    let b = 0
    const a = requestAnimationFrame(() => { b = requestAnimationFrame(() => setGrown(true)) })
    return () => { cancelAnimationFrame(a); cancelAnimationFrame(b) }
  }, [])
  return grown
}

const GROW = 'transition-[width,transform] duration-700 ease-out motion-reduce:transition-none'
const PALETTE = ['var(--sky-ink)', 'var(--lavender-ink)', 'var(--sage-ink)', 'var(--peach-ink)', 'var(--blush-ink)', 'var(--accent)', 'var(--info)', 'var(--warn)']

// ---------- #1 in each category ----------
export function ChartToppers({ roles, name }: Named) {
  const enough = roles.filter((r) => r.total_openings >= 100) // tiny samples shouldn't top a chart
  const byOpenings = [...roles].sort((a, b) => b.total_openings - a.total_openings)[0]
  const byPay = roles.filter((r) => r.salary).sort((a, b) => b.salary!.p50 - a.salary!.p50)[0]
  const byFresher = enough.filter((r) => r.fresher_share !== null).sort((a, b) => b.fresher_share! - a.fresher_share!)[0]
  const skill = hotSkills(roles)[0]

  const tiles: { kicker: string; icon: IconName; tone: string; title: string; stat: string; to: string }[] = []
  if (byOpenings) tiles.push({ kicker: 'Most openings', icon: 'trophy', tone: 'bg-peach text-peach-ink', title: name(byOpenings.role_id), stat: `${num(byOpenings.total_openings)} openings`, to: `/market/${byOpenings.role_id}` })
  if (byPay) tiles.push({ kicker: 'Highest pay', icon: 'up', tone: 'bg-sage text-sage-ink', title: name(byPay.role_id), stat: `${lakhs(byPay.salary!.p50)} a year (middle)`, to: `/market/${byPay.role_id}` })
  if (byFresher) tiles.push({ kicker: 'Most fresher-friendly', icon: 'target', tone: 'bg-sky text-sky-ink', title: name(byFresher.role_id), stat: `${Math.round(byFresher.fresher_share! * 100)}% of ads welcome freshers`, to: `/market/${byFresher.role_id}` })
  if (skill) tiles.push({ kicker: 'Most-asked skill', icon: 'flame', tone: 'bg-lavender text-lavender-ink', title: skill.skill, stat: `Asked for in ${skill.roles.length} of ${roles.length} roles`, to: `/market/${skill.roles[0].id}` })

  return (
    <ul className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      {tiles.map((t, i) => (
        <li key={t.kicker} className="motion-reduce-static" style={{ animation: `pop-in 500ms ${i * 80}ms both` }}>
          <Link to={t.to} className={`group relative h-full overflow-hidden rounded-2xl p-4 flex flex-col gap-1 transition-all ${t.tone}`}>
            <span aria-hidden="true" className="absolute right-3 top-3 font-bold text-xl leading-none opacity-40 select-none">#1</span>
            <span className="flex items-center gap-1.5 pr-10 text-xs font-semibold uppercase tracking-wide"><Icon name={t.icon} size={14} /> {t.kicker}</span>
            <span className="font-semibold text-ink text-base sm:text-lg leading-snug mt-1">{t.title}</span>
            <span className="text-xs sm:text-sm mt-auto pt-1">{t.stat}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

// ---------- The five charts ----------
type Tab = 'openings' | 'pay' | 'map' | 'skills' | 'cities'
const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'openings', label: 'Openings', icon: 'trophy' },
  { id: 'pay', label: 'Pay ladder', icon: 'up' },
  { id: 'map', label: 'Sweet spot', icon: 'target' },
  { id: 'skills', label: 'Hot skills', icon: 'flame' },
  { id: 'cities', label: 'Top cities', icon: 'map' },
]
const NOTES: Record<Tab, string> = {
  openings: 'Job ads posted in the last 30 days for each role.',
  pay: 'The middle half of salaries stated in ads, with the middle salary marked. Freshers usually start near the left end.',
  map: 'Each bubble is a role: further right means more openings, higher up means better pay. Bigger bubbles welcome more freshers.',
  skills: 'Estimated number of ads naming each skill, across every role.',
  cities: 'Where the openings are, across every role.',
}

export function MarketCharts({ roles, name, goalRole, mySkills }: Named & { goalRole?: string | null; mySkills: Set<string> }) {
  const [tab, setTab] = useState<Tab>('openings')
  return (
    <section className="rounded-2xl bg-card border border-line p-4 sm:p-6 space-y-5 min-w-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display font-semibold text-2xl sm:text-3xl leading-tight">Top charts</h2>
          <p className="text-sm text-muted mt-1">{NOTES[tab]}</p>
        </div>
      </div>
      {/* On phones the tabs scroll sideways: a soft fade on the right hints there are more, and a tapped tab slides fully into view */}
      <div role="tablist" aria-label="Charts" className="flex gap-1 rounded-xl bg-raised p-1 overflow-x-auto [scrollbar-width:none] max-w-full w-fit max-sm:[mask-image:linear-gradient(90deg,black_85%,transparent)] max-sm:pr-8">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id}
            onClick={(e) => { setTab(t.id); e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }) }}
            className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 min-h-10 px-3 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-card text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>
            <Icon name={t.icon} size={15} /> {t.label}
          </button>
        ))}
      </div>
      {/* key: each chart remounts, so its bars grow again when you switch */}
      <div key={tab} role="tabpanel">
        {tab === 'openings' && <OpeningsChart roles={roles} name={name} goalRole={goalRole} />}
        {tab === 'pay' && <PayLadder roles={roles} name={name} goalRole={goalRole} />}
        {tab === 'map' && <SweetSpot roles={roles} name={name} goalRole={goalRole} />}
        {tab === 'skills' && <HotSkills roles={roles} name={name} mySkills={mySkills} />}
        {tab === 'cities' && <CitiesChart roles={roles} />}
      </div>
    </section>
  )
}

const RANK_TONE = ['bg-peach text-peach-ink', 'bg-sky text-sky-ink', 'bg-lavender text-lavender-ink']
function Rank({ i }: { i: number }) {
  return (
    <span className={`w-8 h-8 rounded-full grid place-items-center text-sm font-bold tabular-nums shrink-0 ${RANK_TONE[i] ?? 'text-muted'}`}>{i + 1}</span>
  )
}
function GoalTag() {
  return <span className="hidden sm:inline ml-2 align-middle text-[10px] font-semibold rounded-full bg-accent-soft text-accent-deep px-1.5 py-0.5">Your goal</span>
}

function OpeningsChart({ roles, name, goalRole }: Named & { goalRole?: string | null }) {
  const grown = useGrow()
  const sorted = [...roles].sort((a, b) => b.total_openings - a.total_openings)
  const max = sorted[0]?.total_openings || 1
  return (
    <ol className="space-y-1">
      {sorted.map((r, i) => (
        <li key={r.role_id}>
          <Link to={`/market/${r.role_id}`} className="grid grid-cols-[2rem_minmax(0,1fr)] sm:grid-cols-[2rem_17rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1 rounded-xl px-2 py-1.5 hover:bg-raised">
            <Rank i={i} />
            <span className={`text-sm truncate ${r.role_id === goalRole ? "font-semibold text-accent-deep" : "font-medium"}`}><RoleName id={r.role_id} name={name} />{r.role_id === goalRole && <GoalTag />}</span>
            <span className="col-start-2 sm:col-start-3 flex items-center gap-3 min-w-0">
              <span className="flex-1 h-3 rounded-full bg-raised overflow-hidden">
                <span className={`block h-full rounded-full ${GROW} ${i < 3 ? 'bg-accent' : 'bg-accent/40'}`}
                  style={{ width: grown ? `${Math.max(2, (r.total_openings / max) * 100)}%` : 0, transitionDelay: `${i * 45}ms` }} />
              </span>
              <span className="w-14 text-right text-sm font-mono tabular-nums">{num(r.total_openings)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  )
}

function PayLadder({ roles, name, goalRole }: Named & { goalRole?: string | null }) {
  const grown = useGrow()
  const paid = roles.filter((r) => r.salary).sort((a, b) => b.salary!.p50 - a.salary!.p50)
  const none = roles.filter((r) => !r.salary)
  if (paid.length === 0) return <p className="text-sm text-muted">Not enough ads state a salary yet.</p>
  const maxL = Math.ceil(Math.max(...paid.map((r) => r.salary!.p75)) / 500_000) * 5 // axis end, in lakhs, on a 5L step
  const pct = (v: number) => (v / (maxL * 100_000)) * 100
  const ticks = Array.from({ length: maxL / 5 + 1 }, (_, i) => i * 5)
  const grid = 'grid grid-cols-[6.5rem_minmax(0,1fr)_3.5rem] sm:grid-cols-[17rem_minmax(0,1fr)_4rem] items-center gap-3'
  return (
    <div>
      <ul className="space-y-1">
        {paid.map((r, i) => (
          <li key={r.role_id}>
            <Link to={`/market/${r.role_id}`} className={`${grid} rounded-xl px-2 py-2 hover:bg-raised`}>
              <span className={`text-sm truncate ${r.role_id === goalRole ? "font-semibold text-accent-deep" : "font-medium"}`}><RoleName id={r.role_id} name={name} />{r.role_id === goalRole && <GoalTag />}</span>
              <span className="relative h-4">
                {ticks.map((t) => <span key={t} className="absolute inset-y-0 w-px bg-line" style={{ left: `${pct(t * 100_000)}%` }} aria-hidden="true" />)}
                <span className={`absolute top-0.5 h-3 rounded-full bg-accent origin-left ${GROW}`}
                  style={{ left: `${pct(r.salary!.p25)}%`, width: `${pct(r.salary!.p75 - r.salary!.p25)}%`, transform: grown ? 'scaleX(1)' : 'scaleX(0)', transitionDelay: `${i * 45}ms` }} />
                <span className={`absolute -top-0.5 w-5 h-5 -ml-2.5 rounded-full bg-card border-[3px] border-accent transition-opacity duration-500 ${grown ? 'opacity-100' : 'opacity-0'}`}
                  style={{ left: `${pct(r.salary!.p50)}%`, transitionDelay: `${300 + i * 45}ms` }} aria-hidden="true" />
              </span>
              <span className="text-sm font-mono tabular-nums text-right">{lakhs(r.salary!.p50)}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className={`${grid} px-2 mt-1`} aria-hidden="true">
        <span />
        <span className="relative h-4 text-[11px] text-muted">
          {ticks.map((t, i) => (
            <span key={t} className={`absolute -translate-x-1/2 ${i % 2 ? 'hidden sm:block' : ''}`} style={{ left: `${pct(t * 100_000)}%` }}>₹{t}L</span>
          ))}
        </span>
        <span className="text-[11px] text-muted text-right">middle</span>
      </div>
      {none.length > 0 && <p className="text-xs text-muted mt-4">Too few ads state a salary for: {none.map((r) => SHORT_ROLE[r.role_id] ?? name(r.role_id)).join(', ')}.</p>}
    </div>
  )
}

// Width of an element, kept up to date (the bubble chart draws at real pixel size so its text stays readable on phones)
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.clientWidth)
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2 }

function SweetSpot({ roles, name, goalRole }: Named & { goalRole?: string | null }) {
  const [ref, W] = useWidth<HTMLDivElement>()
  const [picked, setPicked] = useState<string | null>(null)
  const pts = roles.filter((r) => r.salary && r.total_openings > 0)

  const chart = (() => {
    if (!W || pts.length < 2) return null
    const H = W < 520 ? 300 : 380
    const pad = { l: 46, r: 14, t: 14, b: 34 }
    const lx = pts.map((r) => Math.log10(r.total_openings))
    const ly = pts.map((r) => r.salary!.p50 / 100_000)
    const x0 = Math.min(...lx) - 0.15, x1 = Math.max(...lx) + 0.15
    const y0 = Math.max(0, Math.floor(Math.min(...ly)) - 2), y1 = Math.ceil(Math.max(...ly)) + 2
    const X = (openings: number) => pad.l + ((Math.log10(openings) - x0) / (x1 - x0)) * (W - pad.l - pad.r)
    const Y = (l: number) => pad.t + (1 - (l - y0) / (y1 - y0)) * (H - pad.t - pad.b)
    const midX = X(10 ** median(lx)), midY = Y(median(ly))
    const xTicks = [10, 30, 100, 300, 1000, 3000, 10_000, 30_000].filter((t) => Math.log10(t) >= x0 && Math.log10(t) <= x1)
    const step = y1 - y0 > 20 ? 5 : 2
    const yTicks = Array.from({ length: 30 }, (_, i) => Math.ceil(y0 / step) * step + i * step).filter((t) => t <= y1)

    // Bubbles, then labels placed where they don't overlap each other
    const dots = pts.map((r, i) => ({ r, i, cx: X(r.total_openings), cy: Y(r.salary!.p50 / 100_000), rad: 7 + Math.min(8, (r.fresher_share ?? 0) * 90) }))
    const boxes: { x: number; y: number; w: number; h: number }[] = []
    const hits = (b: { x: number; y: number; w: number; h: number }) => boxes.some((o) => b.x < o.x + o.w && o.x < b.x + b.w && b.y < o.y + o.h && o.y < b.y + b.h)
      || dots.some((d) => b.x < d.cx + d.rad && d.cx - d.rad < b.x + b.w && b.y < d.cy + d.rad && d.cy - d.rad < b.y + b.h)
    const labels = [...dots].sort((a, b) => a.cy - b.cy).map((d) => {
      const text = SHORT_ROLE[d.r.role_id] ?? name(d.r.role_id)
      const w = text.length * 6.6 + 4, h = 14
      const options = [
        { x: d.cx + d.rad + 4, y: d.cy - h / 2 }, { x: d.cx - d.rad - 4 - w, y: d.cy - h / 2 },
        { x: d.cx - w / 2, y: d.cy - d.rad - h - 1 }, { x: d.cx - w / 2, y: d.cy + d.rad + 1 },
      ].filter((o) => o.x >= 0 && o.x + w <= W && o.y >= 0 && o.y + h <= H)
      const spot = options.find((o) => !hits({ ...o, w, h })) ?? options[0] ?? { x: d.cx + d.rad + 4, y: d.cy - h / 2 }
      boxes.push({ ...spot, w, h })
      return { id: d.r.role_id, text, ...spot }
    })
    return { H, pad, midX, midY, X, Y, xTicks, yTicks, dots, labels }
  })()

  const sel = pts.find((r) => r.role_id === picked)
  const pick = (id: string) => setPicked((p) => (p === id ? null : id))
  const onKey = (id: string) => (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(id) } }

  if (pts.length < 2) return <p className="text-sm text-muted">Not enough salary data to draw this yet.</p>
  return (
    <div>
      <div ref={ref} className="w-full">
        {chart && (
          <svg width={W} height={chart.H} role="img" aria-label="Roles plotted by number of openings and typical pay" className="block select-none">
            {/* Top-right quarter: many openings and high pay */}
            <rect x={chart.midX} y={chart.pad.t} width={W - chart.pad.r - chart.midX} height={chart.midY - chart.pad.t} fill="var(--sage)" rx="10" />
            <text x={W - chart.pad.r - 8} y={chart.pad.t + 18} textAnchor="end" fontSize="12" fontWeight="700" fill="var(--sage-ink)">★ Sweet spot</text>
            <text x={chart.pad.l + 6} y={chart.pad.t + 16} fontSize="11" fill="var(--muted)">Fewer jobs, higher pay</text>
            <text x={W - chart.pad.r - 8} y={chart.H - chart.pad.b - 8} textAnchor="end" fontSize="11" fill="var(--muted)">More jobs, lower pay</text>
            {chart.yTicks.map((t) => (
              <g key={`y${t}`}>
                <line x1={chart.pad.l} x2={W - chart.pad.r} y1={chart.Y(t)} y2={chart.Y(t)} stroke="var(--line)" strokeDasharray="3 4" />
                <text x={chart.pad.l - 6} y={chart.Y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">₹{t}L</text>
              </g>
            ))}
            {chart.xTicks.map((t) => (
              <g key={`x${t}`}>
                <line x1={chart.X(t)} x2={chart.X(t)} y1={chart.pad.t} y2={chart.H - chart.pad.b} stroke="var(--line)" strokeDasharray="3 4" />
                <text x={chart.X(t)} y={chart.H - chart.pad.b + 16} textAnchor="middle" fontSize="11" fill="var(--muted)">{compact(t)}</text>
              </g>
            ))}
            <text x={(chart.pad.l + W - chart.pad.r) / 2} y={chart.H - 4} textAnchor="middle" fontSize="11" fill="var(--muted)">Openings in 30 days →</text>
            {chart.dots.map((d) => (
              <g key={d.r.role_id} role="button" tabIndex={0} aria-label={`${name(d.r.role_id)}: ${num(d.r.total_openings)} openings, middle pay ${lakhs(d.r.salary!.p50)}`}
                onClick={() => pick(d.r.role_id)} onKeyDown={onKey(d.r.role_id)} className="cursor-pointer outline-none focus-visible:[&>circle]:stroke-accent">
                <circle cx={d.cx} cy={d.cy} r={d.rad} fill={PALETTE[d.i % PALETTE.length]} fillOpacity={picked && picked !== d.r.role_id ? 0.35 : 0.85}
                  stroke={d.r.role_id === goalRole || d.r.role_id === picked ? 'var(--accent)' : 'var(--card)'} strokeWidth={d.r.role_id === goalRole || d.r.role_id === picked ? 3 : 2}
                  className="motion-reduce-static" style={{ animation: `pop-in 500ms ${d.i * 60}ms both`, transformBox: 'fill-box', transformOrigin: 'center' }} />
              </g>
            ))}
            {chart.labels.map((l) => (
              <text key={`l${l.id}`} x={l.x + 2} y={l.y + 11} fontSize="12" fontWeight={l.id === picked || l.id === goalRole ? 700 : 500} fill="var(--ink)"
                onClick={() => pick(l.id)} className="cursor-pointer">{l.text}</text>
            ))}
          </svg>
        )}
      </div>
      <div className="mt-3 min-h-16 rounded-xl bg-raised p-3 text-sm">
        {sel ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-semibold">{name(sel.role_id)}</span>
            <span className="text-soft">{num(sel.total_openings)} openings</span>
            <span className="text-soft">middle pay {lakhs(sel.salary!.p50)}</span>
            {sel.fresher_share !== null && <span className="text-soft">{Math.round(sel.fresher_share * 100)}% fresher-friendly</span>}
            <Link to={`/market/${sel.role_id}`} className="ml-auto font-semibold text-accent-deep inline-flex items-center gap-1">See skills <Icon name="arrow" size={14} /></Link>
          </div>
        ) : <p className="text-muted">Tap a bubble to see the role. Roles in the green corner have both plenty of openings and higher pay.</p>}
      </div>
      {roles.length > pts.length && (
        <p className="text-xs text-muted mt-3">Not shown, because too few ads state a salary: {roles.filter((r) => !pts.includes(r)).map((r) => SHORT_ROLE[r.role_id] ?? name(r.role_id)).join(', ')}.</p>
      )}
    </div>
  )
}

function HotSkills({ roles, name, mySkills }: Named & { mySkills: Set<string> }) {
  const grown = useGrow()
  const top = hotSkills(roles).slice(0, 10)
  const max = top[0]?.est || 1
  return (
    <ol className="space-y-1">
      {top.map((s, i) => {
        const where = roles.find((r) => r.role_id === s.roles[0].id)!
        return (
          <li key={s.skill}>
            <Link to={`/market/${where.role_id}`} className="grid grid-cols-[2rem_minmax(0,1fr)] sm:grid-cols-[2rem_13rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1 rounded-xl px-2 py-1.5 hover:bg-raised">
              <Rank i={i} />
              <span className="min-w-0">
                <span className="text-sm font-semibold">{s.skill}</span>
                {mySkills.has(s.skill.toLowerCase()) && <span className="ml-2 align-middle text-[10px] font-semibold rounded-full bg-sage text-sage-ink px-1.5 py-0.5">You have it</span>}
                <span className="block text-xs text-muted truncate">{s.roles.length} {s.roles.length === 1 ? 'role' : 'roles'} · most in {SHORT_ROLE[s.roles[0].id] ?? name(s.roles[0].id)} ({Math.round(s.roles[0].share * 100)}%)</span>
              </span>
              <span className="col-start-2 sm:col-start-3 flex items-center gap-3 min-w-0">
                <span className="flex-1 h-3 rounded-full bg-raised overflow-hidden">
                  <span className={`block h-full rounded-full ${GROW} ${i < 3 ? 'bg-lavender-ink' : 'bg-lavender-ink/35'}`}
                    style={{ width: grown ? `${Math.max(2, (s.est / max) * 100)}%` : 0, transitionDelay: `${i * 45}ms` }} />
                </span>
                <span className="w-14 text-right text-sm font-mono tabular-nums">≈{compact(s.est)}</span>
              </span>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}

function CitiesChart({ roles }: { roles: MarketRole[] }) {
  const grown = useGrow()
  const cities = topCities(roles).slice(0, 8)
  const shown = cities.reduce((t, c) => t + c.share, 0)
  return (
    <div className="space-y-5">
      <div className="flex h-12 w-full overflow-hidden rounded-xl bg-raised" role="img" aria-label={cities.map((c) => `${c.name} ${Math.round(c.share * 100)}%`).join(', ')}>
        {cities.map((c, i) => (
          <span key={c.name} className={`h-full grid place-items-center text-xs font-semibold text-paper overflow-hidden ${GROW}`}
            style={{ width: grown ? `${c.share * 100}%` : 0, background: PALETTE[i % PALETTE.length], transitionDelay: `${i * 60}ms` }}>
            {c.share >= 0.08 && <span className={`truncate px-1 ${c.share < 0.15 ? 'hidden sm:block' : ''}`}>{c.name}</span>}
          </span>
        ))}
      </div>
      <ul className="grid gap-x-6 gap-y-2.5 grid-cols-2 sm:grid-cols-4">
        {cities.map((c, i) => (
          <li key={c.name} className="flex items-center gap-2 min-w-0">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} aria-hidden="true" />
            <span className="text-sm truncate">{c.name}</span>
            <span className="ml-auto text-sm font-mono tabular-nums text-muted">{Math.round(c.share * 100)}%</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">The grey part ({Math.round((1 - shown) * 100)}%) is other cities, remote jobs and ads with no clear location.</p>
    </div>
  )
}
