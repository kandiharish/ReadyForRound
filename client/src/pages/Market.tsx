import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useMe } from '../auth/MeProvider'
import { apiFetch } from '../lib/api'
import { startDrill } from '../lib/sessions'
import { Button, Card, EmptyState, Icon, PageHeader } from '../components/ui'
import { ListSkeleton, TilesSkeleton } from '../components/Skeleton'
import { ChartToppers, MarketCharts } from '../components/MarketCharts'
import { lakhs, num, type Market } from '../lib/market'

function useMarket() {
  const [data, setData] = useState<Market | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const load = () => apiFetch<Market>('/market').then((m) => {
      setData(m)
      // The first fetch of the day runs in the background on the server: check again shortly.
      if (m.configured && m.roles.length === 0) timer = setTimeout(load, 20_000)
    }).catch((e) => setError((e as Error).message))
    load()
    return () => clearTimeout(timer)
  }, [])
  return { data, error }
}

function Updated({ m }: { m: Market }) {
  return (
    <p className="text-xs text-muted">
      Source: {m.source}{m.updatedAt ? ` · updated ${new Date(m.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}` : ''}.
      Salaries come only from ads that state one. Trends, not exact totals: not every Indian job board is included.
    </p>
  )
}

function NotReady({ m }: { m: Market }) {
  return m.configured ? (
    <EmptyState title="Fetching today's job ads…" body="This takes about a minute the first time. The page will update by itself." />
  ) : (
    <EmptyState title="Job market data is coming soon" body="We're connecting the live job-ads source. Check back shortly." />
  )
}

const SORTS = [
  { id: 'openings', label: 'Most openings' },
  { id: 'salary', label: 'Highest paying' },
  { id: 'growth', label: 'Fastest growing' },
  { id: 'fresher', label: 'Fresher friendly' },
] as const

export default function Market() {
  const { data, error } = useMarket()
  const { me, label } = useMe()
  const [sort, setSort] = useState<(typeof SORTS)[number]['id']>('openings')
  if (error) return <p className="text-bad">{error}</p>
  if (!data) return <TilesSkeleton count={9} label="Loading the job market" />

  const roles = [...data.roles].sort((a, b) =>
    sort === 'salary' ? (b.salary?.p50 ?? 0) - (a.salary?.p50 ?? 0)
      : sort === 'growth' ? (b.trend ?? -999) - (a.trend ?? -999)
        : sort === 'fresher' ? (b.fresher_share ?? 0) - (a.fresher_share ?? 0)
          : b.total_openings - a.total_openings)
  const goalRole = me?.active_goal?.target_role
  const mySkills = new Set((me?.user_skills ?? []).map((s) => s.skill.toLowerCase()))
  const name = (id: string) => label('roles', id)

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Job market" title="What employers want right now"
        subtitle="Openings, pay and the skills asked for in real job ads across India. Pick a role to see exactly what to learn." />
      {data.roles.length === 0 ? <NotReady m={data} /> : (
        <>
          <ChartToppers roles={data.roles} name={name} />
          <MarketCharts roles={data.roles} name={name} goalRole={goalRole} mySkills={mySkills} />
          <div className="flex flex-wrap items-end justify-between gap-3 pt-2">
            <div>
              <h2 className="font-display font-semibold text-2xl sm:text-3xl leading-tight">Every role</h2>
              <p className="text-sm text-muted mt-1">Pick one to see its pay, cities and the skills to learn.</p>
            </div>
            <div role="tablist" aria-label="Sort roles" className="flex flex-wrap gap-1 rounded-xl bg-raised p-1 w-fit">
            {/* "Fastest growing" needs about a month of daily snapshots, so it appears once trends exist */}
            {SORTS.filter((s) => s.id !== 'growth' || data.roles.some((r) => r.trend !== null)).map((s) => (
              <button key={s.id} type="button" role="tab" aria-selected={sort === s.id} onClick={() => setSort(s.id)}
                className={`min-h-10 px-3.5 rounded-lg text-sm font-medium transition-colors ${sort === s.id ? 'bg-card text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>
                {s.label}
              </button>
            ))}
            </div>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {roles.map((r, i) => (
              <li key={r.role_id}>
                <Link to={`/market/${r.role_id}`}
                  className={`group h-full rounded-2xl bg-card border p-5 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all ${r.role_id === goalRole ? 'border-accent' : 'border-line hover:border-accent/40'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-xs font-mono text-muted">#{i + 1}</span>
                      <p className="font-semibold text-lg leading-tight">{label('roles', r.role_id)}</p>
                    </div>
                    {r.role_id === goalRole && <span className="text-[11px] font-semibold rounded-full bg-accent-soft text-accent-deep px-2 py-0.5 shrink-0">Your goal</span>}
                  </div>
                  <div className="flex items-end gap-3">
                    <span className="font-display font-semibold text-3xl leading-none">{num(r.total_openings)}</span>
                    <span className="text-xs text-muted mb-0.5">openings · 30 days</span>
                    {r.trend !== null && (
                      <span className={`ml-auto text-xs font-semibold rounded-full px-2 py-0.5 ${r.trend >= 0 ? 'bg-sage text-sage-ink' : 'bg-blush text-blush-ink'}`}>
                        {r.trend >= 0 ? '↑' : '↓'} {Math.abs(r.trend)}%
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-soft">
                    {r.salary ? <><b className="text-ink">{lakhs(r.salary.p25)}–{lakhs(r.salary.p75)}</b> a year (typical)</> : <span className="text-muted">Not enough salary data yet</span>}
                    {r.fresher_share !== null && <span className="text-muted"> · {Math.round(r.fresher_share * 100)}% open to freshers</span>}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-1.5">
                    {r.skills.slice(0, 4).map((s) => <span key={s.skill} className="rounded-full bg-raised px-2.5 py-1 text-xs text-soft">{s.skill}</span>)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      <Updated m={data} />
    </div>
  )
}

// One role in detail: pay, skills employers ask for (and which you already have), cities and companies.
export function MarketRolePage() {
  const { role: roleId } = useParams()
  const { data, error } = useMarket()
  const { me, label, refreshUsage } = useMe()
  const navigate = useNavigate()
  const [starting, setStarting] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  if (error) return <p className="text-bad">{error}</p>
  if (!data || !me) return <ListSkeleton label="Loading role details" />
  const r = data.roles.find((x) => x.role_id === roleId)
  if (!r) return data.roles.length === 0 ? <NotReady m={data} /> : <EmptyState title="Role not found" body="Pick a role from the job market." action={<Link to="/market" className="text-accent-deep font-semibold">Job market</Link>} />

  const mine = new Map(me.user_skills.map((s) => [s.skill.toLowerCase(), s]))
  const status = (skill: string) => {
    const s = mine.get(skill.toLowerCase())
    if (!s) return 'missing' as const
    return s.proven_score !== null && s.proven_score >= 60 ? 'proven' as const : 'claimed' as const
  }
  const have = r.skills.filter((s) => status(s.skill) !== 'missing').length
  const maxSalary = r.salary ? r.salary.p75 * 1.25 : 1

  async function practise(skill: string) {
    setStarting(skill)
    setActionError(null)
    try {
      const iv = await startDrill(skill)
      refreshUsage()
      navigate(`/interview/${iv.id}`)
    } catch (err) {
      setActionError((err as Error).message)
      setStarting(null)
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/market" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><Icon name="arrow" size={15} className="rotate-180" /> Job market</Link>
      <PageHeader eyebrow="Job market" title={label('roles', r.role_id)}
        subtitle={`Based on ${num(r.sample_size)} recent job ads we read, out of ${num(r.total_openings)} openings in the last 30 days.`} />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          ['Openings · 30 days', num(r.total_openings), r.trend !== null ? `${r.trend >= 0 ? '↑' : '↓'} ${Math.abs(r.trend)}% vs last month` : 'Trend after a few weeks of data'],
          ['Typical pay', r.salary ? `${lakhs(r.salary.p25)}–${lakhs(r.salary.p75)}` : '—', r.salary ? `Middle: ${lakhs(r.salary.p50)} a year · ${r.salary.count} ads` : 'Too few ads list a salary'],
          ['Open to freshers', r.fresher_share !== null ? `${Math.round(r.fresher_share * 100)}%` : '—', 'Ads mentioning freshers, graduates or trainees'],
          ['Your skill match', `${have}/${r.skills.length}`, 'Top skills employers ask for'],
        ].map(([k, v, sub]) => (
          <Card key={k}>
            <p className="text-xs text-muted">{k}</p>
            <p className="font-display font-semibold text-3xl mt-1">{v}</p>
            <p className="text-xs text-muted mt-1">{sub}</p>
          </Card>
        ))}
      </div>

      {r.salary && (
        <Card>
          <h2 className="font-semibold">Pay range</h2>
          <p className="text-sm text-muted mt-1">The middle half of salaries stated in ads (yearly, in lakhs). Freshers usually start near the left end.</p>
          <div className="relative h-3 rounded-full bg-raised mt-6">
            <div className="absolute inset-y-0 rounded-full bg-linear-to-r from-[#12a8f0] to-[#7b3cf0]"
              style={{ left: `${(r.salary.p25 / maxSalary) * 100}%`, width: `${((r.salary.p75 - r.salary.p25) / maxSalary) * 100}%` }} />
            <span className="absolute -top-1.5 w-6 h-6 -ml-3 rounded-full bg-card border-4 border-accent" style={{ left: `${(r.salary.p50 / maxSalary) * 100}%` }} aria-hidden="true" />
          </div>
          <div className="flex justify-between text-xs text-muted mt-2">
            <span>{lakhs(r.salary.p25)}</span><span className="font-semibold text-ink">Middle {lakhs(r.salary.p50)}</span><span>{lakhs(r.salary.p75)}</span>
          </div>
        </Card>
      )}

      <Card className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-semibold">Skills employers ask for</h2>
            <p className="text-sm text-muted mt-1">How often each skill is named in the ads, and where you stand. Ads often list more skills than they need, so focus on the top few.</p>
          </div>
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-good" /> Proven</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-warn" /> On your profile</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-line-strong" /> Missing</span>
          </div>
        </div>
        {r.skills.length === 0 ? <p className="text-sm text-muted">Not enough ads to measure skills yet.</p> : (
          <ul className="divide-y divide-line">
            {r.skills.map((s) => {
              const st = status(s.skill)
              return (
                <li key={s.skill} className="py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${st === 'proven' ? 'bg-good' : st === 'claimed' ? 'bg-warn' : 'bg-line-strong'}`} aria-hidden="true" />
                  <span className="w-36 font-medium">{s.skill}</span>
                  <div className="flex-1 min-w-32 h-2 rounded-full bg-raised overflow-hidden">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round(s.share * 100)}%` }} />
                  </div>
                  <span className="w-24 shrink-0 whitespace-nowrap text-right text-sm font-mono text-muted">{Math.round(s.share * 100)}% of ads</span>
                  <span className="w-44 text-right">
                    {st === 'proven' ? <span className="text-xs text-good font-semibold">Proven in interviews</span>
                      : st === 'claimed' ? (
                        <button type="button" onClick={() => practise(s.skill)} disabled={!!starting} className="text-xs font-semibold text-accent-deep hover:underline disabled:opacity-50">
                          {starting === s.skill ? 'Starting…' : 'Prove it: 5-min drill'}
                        </button>
                      ) : (
                        <button type="button" onClick={() => practise(s.skill)} disabled={!!starting} className="text-xs font-semibold text-accent-deep hover:underline disabled:opacity-50">
                          {starting === s.skill ? 'Starting…' : 'Try a 5-min drill'}
                        </button>
                      )}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
        {actionError && <p className="text-sm text-bad">{actionError}</p>}
        <p className="text-xs text-muted">Missing a skill you know? <Link to="/profile" className="text-accent-deep font-semibold">Add it to your profile</Link>, then prove it in an interview.</p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Top cities</h2>
          <ul className="mt-4 space-y-3">
            {r.cities.map((c) => (
              <li key={c.name}>
                <div className="flex justify-between text-sm"><span>{c.name}</span><span className="font-mono text-muted">{Math.round(c.share * 100)}%</span></div>
                <div className="h-2 rounded-full bg-raised mt-1 overflow-hidden"><div className="h-full rounded-full bg-sky-ink/60" style={{ width: `${Math.round(c.share * 100)}%` }} /></div>
              </li>
            ))}
            {r.cities.length === 0 && <li className="text-sm text-muted">Not enough location data.</li>}
          </ul>
        </Card>
        <Card>
          <h2 className="font-semibold">Companies hiring</h2>
          <p className="text-xs text-muted mt-1">From the ads we read. Not an endorsement or partnership.</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {r.companies.map((c) => <li key={c.name} className="rounded-full bg-raised px-3 py-1.5 text-sm">{c.name} <span className="text-muted text-xs">· {c.count}</span></li>)}
            {r.companies.length === 0 && <li className="text-sm text-muted">Not enough data.</li>}
          </ul>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        {me.active_goal?.target_role !== r.role_id && <Button onClick={() => navigate(`/goals?role=${r.role_id}`)}><Icon name="goals" size={16} /> Make this my goal</Button>}
        <Link to="/companies" className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl border border-line-strong bg-card text-sm font-medium hover:bg-raised"><Icon name="building" size={16} /> Practise for companies</Link>
      </div>
      <Updated m={data} />
    </div>
  )
}
