import { resourcesFor, videoSearch, type ResourceKind } from '../lib/resources'

// "Where to learn this": hand-picked free resources for a topic, plus a video search.
// Links open in a new tab. Nothing here is written by AI.

const KIND: Record<ResourceKind, { label: string; cls: string }> = {
  docs: { label: 'Docs', cls: 'bg-sky text-sky-ink' },
  course: { label: 'Course', cls: 'bg-lavender text-lavender-ink' },
  practice: { label: 'Practice', cls: 'bg-sage text-sage-ink' },
  article: { label: 'Read', cls: 'bg-peach text-peach-ink' },
  book: { label: 'Free book', cls: 'bg-blush text-blush-ink' },
}

const external = { target: '_blank', rel: 'noopener noreferrer' } as const

function ArrowOut() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  )
}

// context: extra words (like the reason a topic was suggested) used only if the topic alone doesn't match
export function ResourceLinks({ topic, context = '', limit = 2, className = '' }: { topic: string; context?: string; limit?: number; className?: string }) {
  const found = resourcesFor(topic, limit) ?? (context ? resourcesFor(`${topic} ${context}`, limit) : null)
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted mr-0.5">Learn</span>
      {found?.links.map((l) => (
        <a key={l.url} href={l.url} {...external} title={l.title}
          className="group inline-flex items-center gap-1.5 rounded-full border border-line bg-card pl-1 pr-2.5 py-1 text-xs text-soft hover:text-ink hover:border-line-strong hover:shadow-sm transition-all">
          <span className={`rounded-full px-1.5 py-px text-[10px] font-semibold ${KIND[l.kind].cls}`}>{KIND[l.kind].label}</span>
          {/* Two links from the same site show their titles, so they don't look identical */}
          <span className="font-medium">{found.links.filter((x) => x.site === l.site).length > 1 ? l.title : l.site}</span>
          <ArrowOut />
        </a>
      ))}
      <a href={videoSearch(found?.name ?? topic)} {...external} title={`Search videos about ${topic}`}
        className="group inline-flex items-center gap-1.5 rounded-full border border-line bg-card pl-1 pr-2.5 py-1 text-xs text-soft hover:text-ink hover:border-line-strong hover:shadow-sm transition-all">
        <span className="rounded-full px-1.5 py-px text-[10px] font-semibold bg-bad-soft text-bad">Videos</span>
        <span className="font-medium">YouTube</span>
        <ArrowOut />
      </a>
    </div>
  )
}
