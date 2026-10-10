import { useCallback, useEffect, useState } from 'react'
import { STORIES, type Story } from '../lib/inspiration'

const SEEN_KEY = 'rfr-seen-stories'

function loadSeen(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]')) } catch { return new Set() }
}

// Short interview guides as a plain list. Unread ones carry a small blue dot; each opens in a reading panel.
export function GuidesList() {
  const [seen, setSeen] = useState<Set<string>>(loadSeen)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const markSeen = useCallback((id: string) => {
    setSeen((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev).add(id)
      try { localStorage.setItem(SEEN_KEY, JSON.stringify([...next])) } catch { /* fine */ }
      return next
    })
  }, [])

  return (
    <section aria-labelledby="guides-title">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="guides-title" className="font-semibold">Guides</h2>
        <span className="text-xs text-muted">General tips interviewers commonly share</span>
      </div>
      <ul className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
        {STORIES.map((s, i) => (
          <li key={s.id} className="border-t border-line">
            <button type="button" onClick={() => setOpenIndex(i)} className="group w-full flex items-center gap-3 min-h-12 text-left">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-muted shrink-0"><path d={s.icon} /></svg>
              <span className="flex-1 text-sm text-ink group-hover:text-accent-deep">{s.title}</span>
              {!seen.has(s.id) && <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-label="Not read yet" />}
            </button>
          </li>
        ))}
      </ul>
      {openIndex !== null && (
        <GuideViewer index={openIndex} onIndex={setOpenIndex} onClose={() => setOpenIndex(null)} onSeen={markSeen} />
      )}
    </section>
  )
}

function GuideViewer({ index, onIndex, onClose, onSeen }: { index: number; onIndex: (i: number) => void; onClose: () => void; onSeen: (id: string) => void }) {
  const story: Story = STORIES[index]
  const [slide, setSlide] = useState(0)

  useEffect(() => { setSlide(0); onSeen(story.id) }, [story.id, onSeen])

  const next = useCallback(() => {
    if (slide < story.slides.length - 1) setSlide(slide + 1)
    else if (index < STORIES.length - 1) onIndex(index + 1)
    else onClose()
  }, [slide, story.slides.length, index, onIndex, onClose])

  const prev = useCallback(() => {
    if (slide > 0) setSlide(slide - 1)
    else if (index > 0) onIndex(index - 1)
  }, [slide, index, onIndex])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, onClose])

  const s = story.slides[slide]
  const lastSlide = slide === story.slides.length - 1
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div role="dialog" aria-modal="true" aria-label={story.title}
        className="relative w-full max-w-lg rounded-xl bg-card border border-line shadow-2xl flex flex-col animate-[toast-in_0.18s_ease-out]">
        <div className="flex items-center justify-between gap-4 px-6 h-14 border-b border-line">
          <span className="text-sm font-medium text-muted">{story.title}</span>
          <button type="button" onClick={onClose} aria-label="Close guide" className="w-8 h-8 -mr-2 rounded-md text-muted hover:text-ink hover:bg-raised flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>

        <div key={`${story.id}-${slide}`} className="px-6 py-6 min-h-64 animate-[toast-in_0.2s_ease-out]">
          <h3 className="text-xl font-semibold leading-snug">{s.heading}</h3>
          <ul className="mt-4 space-y-2.5">
            {s.points.map((p) => (
              <li key={p} className="flex gap-3 text-[15px] leading-relaxed text-soft">
                <span className="mt-2.5 w-1 h-1 rounded-full bg-muted shrink-0" aria-hidden="true" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between gap-4 px-6 h-16 border-t border-line">
          <button type="button" onClick={prev} disabled={index === 0 && slide === 0}
            className="min-h-9 px-3 rounded-lg text-sm font-medium text-soft hover:bg-raised disabled:opacity-30">Back</button>
          <span className="flex gap-1" aria-label={`Page ${slide + 1} of ${story.slides.length}`}>
            {story.slides.map((_, i) => <span key={i} className={`h-1 rounded-full transition-all ${i === slide ? 'w-4 bg-ink' : 'w-1 bg-line-strong'}`} />)}
          </span>
          <button type="button" onClick={next}
            className="min-h-9 px-4 rounded-lg text-sm font-semibold bg-accent text-on-accent hover:bg-accent-hover">
            {!lastSlide ? 'Next' : index < STORIES.length - 1 ? 'Next guide' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  )
}
