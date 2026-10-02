import { useEffect, useId, useRef, useState } from 'react'

export type SelectOption = { value: string; label: string; hint?: string }

// Our own dropdown, styled like the rest of the app (the browser's built-in list ignores our design).
// Works with the keyboard: Enter/Space/Arrow keys to open and move, Enter to choose, Escape to close.
export function Select({ value, onChange, options, label, placeholder = 'Choose…', stage = false, className = '' }: {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  label: string // read out by screen readers
  placeholder?: string
  stage?: boolean // use the interview-room colours
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0) // highlighted option while open
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listId = useId()
  const selected = options.find((o) => o.value === value)

  // Close when clicking anywhere outside.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Keep the highlighted option in view in long lists.
  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  function openList() {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)))
    setOpen(true)
  }

  function choose(i: number) {
    onChange(options[i].value)
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); openList() }
      return
    }
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false) }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(options.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)) }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active) }
    else if (e.key === 'Tab') setOpen(false)
  }

  const c = stage
    ? { btn: 'bg-stage-card border-stage-line text-stage-text', list: 'bg-stage-card border-stage-line', item: 'text-stage-text', on: 'bg-stage-raised', hint: 'text-stage-muted' }
    : { btn: 'bg-card border-line-strong text-ink', list: 'bg-card border-line', item: 'text-ink', on: 'bg-accent-soft', hint: 'text-muted' }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button type="button" role="combobox" aria-label={label} aria-expanded={open} aria-controls={listId} aria-haspopup="listbox"
        onClick={() => (open ? setOpen(false) : openList())} onKeyDown={onKeyDown}
        className={`w-full min-h-11 flex items-center justify-between gap-2 rounded-xl border px-3.5 text-left text-sm transition-colors hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${c.btn} ${open ? 'border-accent ring-2 ring-accent/20' : ''}`}>
        <span className={`truncate ${selected ? '' : 'opacity-60'}`}>{selected?.label ?? placeholder}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          className={`shrink-0 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
      </button>

      {open && (
        <ul ref={listRef} id={listId} role="listbox" aria-label={label}
          className={`absolute z-40 mt-1.5 w-full max-h-72 overflow-auto rounded-xl border p-1.5 shadow-xl animate-[toast-in_0.12s_ease-out] ${c.list}`}>
          {options.map((o, i) => {
            const isSelected = o.value === value
            return (
              <li key={o.value} role="option" aria-selected={isSelected}
                onMouseEnter={() => setActive(i)} onMouseDown={(e) => { e.preventDefault(); choose(i) }}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm cursor-pointer ${c.item} ${i === active ? c.on : ''}`}>
                <span className="flex-1 min-w-0">
                  <span className={`block truncate ${isSelected ? 'font-semibold' : ''}`}>{o.label}</span>
                  {o.hint && <span className={`block text-xs truncate ${c.hint}`}>{o.hint}</span>}
                </span>
                {isSelected && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-accent">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
