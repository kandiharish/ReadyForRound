import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { canonicalSkill, searchSkills } from '../lib/skills'

export const RATING_LEVELS = [
  { n: 1, label: 'Just started', hint: "I've watched tutorials or written a little code." },
  { n: 2, label: 'Basic', hint: 'I can do simple tasks, sometimes with help.' },
  { n: 3, label: 'Comfortable', hint: "I've used it in a project on my own." },
  { n: 4, label: 'Good', hint: 'I can explain how it works and solve tricky problems.' },
  { n: 5, label: 'Expert', hint: 'I could teach it and handle deep interview questions.' },
]

// Search the skill dictionary, pick a skill, rate it in a pop-up, then add the next one.
// Only dictionary skills can be added, so typos and random words never reach the profile.
export function SkillPicker({ skills, onChange, suggested = [], fromResume = [], extra }: {
  skills: Record<string, number> // skill name -> self rating 1..5
  onChange: (next: Record<string, number>) => void
  suggested?: string[] // e.g. the usual skills for the student's target role
  fromResume?: string[] // skills found on their resume (matched to the dictionary below)
  extra?: (skill: string) => ReactNode // something to show on each row (e.g. proven score)
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [rating, setRating] = useState<string | null>(null) // skill waiting for a rating
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const added = Object.keys(skills)
  const matches = searchSkills(query, added)
  const suggestions = suggested.filter((s) => !skills[s])
  const resumeSuggestions = [...new Set(fromResume.map((s) => canonicalSkill(s)).filter((s): s is string => !!s))]
    .filter((s) => !skills[s] && !suggestions.includes(s))
    .slice(0, 12)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  function pick(name: string) {
    setQuery('')
    setOpen(false)
    setRating(name) // ask for the level before adding
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((i) => Math.min(matches.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (matches[active]) pick(matches[active].name) }
    else if (e.key === 'Escape') setOpen(false)
  }

  function save(name: string, n: number) {
    onChange({ ...skills, [name]: n })
    setRating(null)
    setTimeout(() => inputRef.current?.focus(), 0) // ready for the next skill
  }

  function remove(name: string) {
    const next = { ...skills }
    delete next[name]
    onChange(next)
  }

  return (
    <div className="space-y-4">
      <div ref={rootRef} className="relative max-w-md">
        <label htmlFor={`${listId}-input`} className="sr-only">Search for a skill</label>
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        </span>
        <input ref={inputRef} id={`${listId}-input`} value={query} autoComplete="off" maxLength={40}
          role="combobox" aria-expanded={open && query.length > 0} aria-controls={listId} aria-autocomplete="list"
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0) }}
          onFocus={() => setOpen(true)} onKeyDown={onKeyDown}
          placeholder="Type a skill, e.g. React, SQL, Java"
          className="w-full min-h-11 rounded-xl bg-card border border-line-strong pl-10 pr-3 text-sm text-ink focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />

        {open && query.trim().length > 0 && (
          <ul id={listId} role="listbox" aria-label="Matching skills"
            className="absolute z-40 mt-1.5 w-full max-h-72 overflow-auto rounded-xl border border-line bg-card p-1.5 shadow-xl animate-[toast-in_0.12s_ease-out]">
            {matches.length === 0 ? (
              <li className="px-3 py-3 text-sm text-muted">
                {canonicalSkill(query) ? 'You already added this skill.' : <>No skill called “{query.trim()}” in our list. Check the spelling, or try a shorter word.</>}
              </li>
            ) : matches.map((m, i) => (
              <li key={m.name} role="option" aria-selected={i === active}
                onMouseEnter={() => setActive(i)} onMouseDown={(e) => { e.preventDefault(); pick(m.name) }}
                className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer ${i === active ? 'bg-accent-soft' : ''}`}>
                <span className="font-medium text-ink">{m.name}</span>
                <span className="text-xs text-muted truncate">{m.group}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {suggestions.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted mb-2">Popular for your role</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button key={s} type="button" onClick={() => pick(s)}
                className="px-3 py-1.5 rounded-full border border-dashed border-line-strong text-sm text-soft hover:border-accent hover:text-accent">
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {resumeSuggestions.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted mb-2">From your resume</p>
          <div className="flex flex-wrap gap-2">
            {resumeSuggestions.map((s) => (
              <button key={s} type="button" onClick={() => pick(s)}
                className="px-3 py-1.5 rounded-full border border-dashed border-peach-ink/40 bg-peach/50 text-sm text-peach-ink hover:border-peach-ink">
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {added.length > 0 && (
        <ul className="divide-y divide-line border-y border-line">
          {added.map((skill) => {
            const known = !!canonicalSkill(skill)
            const level = RATING_LEVELS[skills[skill] - 1]
            return (
              <li key={skill} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <span className="min-w-28 font-medium text-ink">
                  {skill}
                  {!known && <span className="block text-xs font-normal text-bad">Not a recognised skill. Please remove it.</span>}
                </span>
                <button type="button" onClick={() => setRating(skill)} title="Change level"
                  className="flex items-center gap-2 rounded-lg px-2 py-1 -mx-2 hover:bg-raised">
                  <span className="flex gap-1" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n} className={`w-2.5 h-2.5 rounded-full ${n <= skills[skill] ? 'bg-accent' : 'bg-line-strong'}`} />
                    ))}
                  </span>
                  <span className="text-xs text-muted">{level?.label} · change</span>
                </button>
                <span className="ml-auto flex items-center gap-3">
                  {extra?.(skill)}
                  <button type="button" onClick={() => remove(skill)} aria-label={`Remove ${skill}`}
                    className="w-8 h-8 rounded-full text-muted hover:bg-raised hover:text-bad flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
                  </button>
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {rating && <RateSkillDialog skill={rating} current={skills[rating]} onSave={(n) => save(rating, n)} onCancel={() => setRating(null)} />}
    </div>
  )
}

// Pop-up asking "How good are you at X?" The skill is added only after a level is chosen.
function RateSkillDialog({ skill, current, onSave, onCancel }: { skill: string; current?: number; onSave: (n: number) => void; onCancel: () => void }) {
  const firstRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { firstRef.current?.focus() }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
      else if (/^[1-5]$/.test(e.key)) onSave(Number(e.key)) // number keys work too
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel, onSave])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Cancel" onClick={onCancel} className="absolute inset-0 bg-[#0b1020]/50 backdrop-blur-sm" />
      <div role="dialog" aria-modal="true" aria-labelledby="rate-title"
        className="relative w-full max-w-md rounded-2xl bg-card border border-line p-6 shadow-2xl animate-[toast-in_0.15s_ease-out]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Rate your level</p>
        <h3 id="rate-title" className="font-display font-semibold text-3xl mt-1">How good are you at {skill}?</h3>
        <p className="text-sm text-muted mt-1">Be honest. Your interviews will show how this compares with what you can prove.</p>
        <div className="mt-5 space-y-2">
          {RATING_LEVELS.map((l, i) => (
            <button key={l.n} ref={i === 0 ? firstRef : undefined} type="button" onClick={() => onSave(l.n)}
              className={`w-full flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left hover:border-accent hover:bg-accent-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${current === l.n ? 'border-accent bg-accent-soft' : 'border-line'}`}>
              <span className="w-8 h-8 shrink-0 rounded-lg bg-raised font-mono text-sm font-semibold flex items-center justify-center text-ink">{l.n}</span>
              <span>
                <span className="block text-sm font-semibold text-ink">{l.label}</span>
                <span className="block text-xs text-muted">{l.hint}</span>
              </span>
            </button>
          ))}
        </div>
        <button type="button" onClick={onCancel} className="mt-4 w-full min-h-11 rounded-xl text-sm text-muted hover:bg-raised">Cancel</button>
      </div>
    </div>
  )
}
