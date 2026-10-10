// The ReadyForRound logo: the "R" mark image plus the name as text.
// The name is real text (not part of the image) so it stays sharp and readable in light and dark mode.
// "For" uses the same cyan-to-violet gradient as the mark.
// collapse: on phones show only the "R" mark, to save space in tight headers.
export function Brand({ size = 'md', tagline = false, collapse = false, className = '' }: { size?: 'sm' | 'md' | 'lg'; tagline?: boolean; collapse?: boolean; className?: string }) {
  const s = {
    sm: { img: 'w-7 h-7', text: 'text-[15px]', tag: 'text-[8px]' },
    md: { img: 'w-8 h-8', text: 'text-base', tag: 'text-[9px]' },
    lg: { img: 'w-11 h-11', text: 'text-2xl', tag: 'text-[10px]' },
  }[size]
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <img src="/logo-mark.png" alt="" aria-hidden="true" className={`${s.img} shrink-0`} />
      <span className={`leading-none ${collapse ? 'max-sm:sr-only' : ''}`}>
        <span className={`${s.text} font-extrabold tracking-tight text-ink`}>
          Ready<span className="text-accent">For</span>Round
        </span>
        {tagline && <span className={`block ${s.tag} font-medium tracking-[0.32em] text-muted mt-1`}>PREPARE. PRACTICE. PROGRESS.</span>}
      </span>
    </span>
  )
}
