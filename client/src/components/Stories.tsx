import { useCallback, useEffect, useState } from 'react'
import { STORIES, type Story } from '../lib/inspiration'

const SEEN_KEY = 'rfr-seen-stories'
const SLIDE_MS = 8000 // auto-advance time per slide

const TINT = {
  blush: { ring: 'from-[#f29ab7] to-[#f6c0a0]', chip: 'bg-blush text-blush-ink', slide: 'bg-blush text-blush-ink' },
  sage: { ring: 'from-[#8fd1a6] to-[#bfe3a0]', chip: 'bg-sage text-sage-ink', slide: 'bg-sage text-sage-ink' },
  lavender: { ring: 'from-[#a99af0] to-[#d7a6ef]', chip: 'bg-lavender text-lavender-ink', slide: 'bg-lavender text-lavender-ink' },
  peach: { ring: 'from-[#f6b07e] to-[#f7d27a]', chip: 'bg-peach text-peach-ink', slide: 'bg-peach text-peach-ink' },
  sky: { ring: 'from-[#7fbbf0] to-[#8ee0d6]', chip: 'bg-sky text-sky-ink', slide: 'bg-sky text-sky-ink' },
} as const

function loadSeen(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]')) } catch { return new Set() }
}

// An Instagram-style row of interview guides. Tap one to open it; unseen ones have a colourful ring.
export function StoriesRow() {
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
    <section aria-label="Interview guides">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-display font-semibold text-2xl">Interview guides</h2>
        <span className="text-xs text-muted hidden sm:inline">Tips interviewers commonly share. General guidance, not quotes from specific people.</span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {STORIES.map((s, i) => {
          const isSeen = seen.has(s.id)
          return (
            <button key={s.id} type="button" onClick={() => setOpenIndex(i)} className="snap-start shrink-0 w-20 flex flex-col items-center gap-2 group">
              <span className={`w-[70px] h-[70px] rounded-full p-[3px] ${isSeen ? 'bg-line-strong' : `bg-linear-to-tr ${TINT[s.tint].ring}`}`}>
                <span className="w-full h-full rounded-full bg-paper p-[3px] block">
                  <span className={`w-full h-full rounded-full flex items-center justify-center transition-transform group-hover:scale-105 ${TINT[s.tint].chip}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={s.icon} /></svg>
                  </span>
                </span>
              </span>
              <span className={`text-xs text-center leading-tight ${isSeen ? 'text-muted' : 'text-ink font-medium'}`}>{s.title}</span>
            </button>
          )
        })}
      </div>
      {openIndex !== null && (
        <StoryViewer index={openIndex} onIndex={setOpenIndex} onClose={() => setOpenIndex(null)} onSeen={markSeen} />
      )}
    </section>
  )
}

function StoryViewer({ index, onIndex, onClose, onSeen }: { index: number; onIndex: (i: number) => void; onClose: () => void; onSeen: (id: string) => void }) {
  const story: Story = STORIES[index]
  const [slide, setSlide] = useState(0)
  const [paused, setPaused] = useState(false)

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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-[#0b1020]/70 backdrop-blur-sm" />
      <div role="dialog" aria-modal="true" aria-label={story.title}
        onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
        className={`relative w-full max-w-md min-h-[460px] rounded-3xl p-6 sm:p-8 flex flex-col shadow-2xl animate-[toast-in_0.18s_ease-out] ${TINT[story.tint].slide}`}>
        {/* Progress bars, one per slide */}
        <div className="flex gap-1.5">
          {story.slides.map((_, i) => (
            <span key={i} className="h-1 flex-1 rounded-full bg-current/20 overflow-hidden">
              {i === slide ? (
                // The current bar fills up over SLIDE_MS; when it finishes, we move on. Hovering pauses it.
                <span key={`${story.id}-${slide}`} onAnimationEnd={next} className="block h-full bg-current"
                  style={{ animation: `story-progress ${SLIDE_MS}ms linear forwards`, animationPlayState: paused ? 'paused' : 'running' }} />
              ) : (
                <span className={`block h-full bg-current ${i < slide ? 'w-full' : 'w-0'}`} />
              )}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] opacity-80">{story.title}</span>
          <button type="button" onClick={onClose} aria-label="Close story" className="w-9 h-9 -mr-2 rounded-full hover:bg-current/10 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>

        <h3 className="font-display font-semibold text-3xl leading-tight mt-6">{s.heading}</h3>
        <ul className="mt-5 space-y-3">
          {s.points.map((p) => (
            <li key={p} className="flex gap-3 text-[15px] leading-relaxed">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-current shrink-0" aria-hidden="true" />
              <span className="opacity-90">{p}</span>
            </li>
          ))}
        </ul>

        <div className="flex-1" />
        <div className="flex items-center justify-between mt-6">
          <button type="button" onClick={prev} disabled={index === 0 && slide === 0}
            className="min-h-11 px-4 rounded-full border border-current/30 text-sm font-medium disabled:opacity-30 hover:bg-current/10">Back</button>
          <span className="text-xs opacity-70">{slide + 1} / {story.slides.length}</span>
          <button type="button" onClick={next}
            className="min-h-11 px-5 rounded-full bg-current/15 text-sm font-semibold hover:bg-current/25">
            {slide < story.slides.length - 1 ? 'Next' : index < STORIES.length - 1 ? 'Next guide' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  )
}
