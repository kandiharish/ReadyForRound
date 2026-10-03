import { useState } from 'react'
import { Link } from 'react-router'
import { useMe } from '../auth/MeProvider'
import { Icon, PageHeader, Spinner } from '../components/ui'
import type { Company } from '../types'

const TINT: Record<Company['tint'], string> = {
  sky: 'bg-sky text-sky-ink',
  lavender: 'bg-lavender text-lavender-ink',
  peach: 'bg-peach text-peach-ink',
  sage: 'bg-sage text-sage-ink',
  blush: 'bg-blush text-blush-ink',
}

// A neutral letter tile instead of the company's real logo (logos are trademarks; we don't imply any partnership).
export function CompanyMark({ company, size = 'md' }: { company: Company; size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'w-16 h-16 rounded-2xl text-xl' : 'w-12 h-12 rounded-xl text-base'
  return (
    <span aria-hidden="true" className={`${box} ${TINT[company.tint]} shrink-0 flex items-center justify-center font-extrabold tracking-tight border border-current/10`}>
      {company.monogram}
    </span>
  )
}

export function NotAffiliated({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs text-muted leading-relaxed ${className}`}>
      ReadyForRound is not affiliated with, endorsed by or sponsored by any company shown. Company names are used only to describe
      practice interviews modelled on their publicly reported hiring processes. Real interviews can differ.
    </p>
  )
}

export default function Companies() {
  const { catalog, label } = useMe()
  const [filter, setFilter] = useState<'all' | Company['type']>('all')
  if (!catalog) return <Spinner />
  const list = catalog.companies.filter((c) => filter === 'all' || c.type === filter)

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Companies" title="Practise for a specific company"
        subtitle="Each company hires differently. Pick one to see how they interview, then take a mock interview in their style and practise their kind of questions." />

      <div role="tablist" aria-label="Company type" className="inline-flex rounded-xl bg-raised p-1 gap-1">
        {([['all', 'All'], ['service', 'Service companies'], ['product', 'Product companies']] as const).map(([id, text]) => (
          <button key={id} type="button" role="tab" aria-selected={filter === id} onClick={() => setFilter(id)}
            className={`min-h-10 px-4 rounded-lg text-sm font-medium transition-colors ${filter === id ? 'bg-card text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>
            {text}
          </button>
        ))}
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((c) => (
          <li key={c.id}>
            <Link to={`/companies/${c.id}`}
              className="group h-full rounded-2xl bg-card border border-line p-5 flex flex-col gap-4 hover:border-accent/40 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="flex items-center gap-4">
                <CompanyMark company={c} />
                <div className="min-w-0">
                  <p className="font-semibold text-lg leading-tight">{c.name}</p>
                  <p className="text-xs text-muted mt-0.5">{label('companyTypes', c.type)}</p>
                </div>
                <Icon name="arrow" size={18} className="ml-auto text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-sm text-soft">{c.tagline}</p>
              <div className="mt-auto flex flex-wrap gap-1.5">
                {c.rounds.map((r) => (
                  <span key={r.id} className="rounded-full bg-raised px-2.5 py-1 text-xs text-soft">{r.label}</span>
                ))}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <NotAffiliated />
    </div>
  )
}
