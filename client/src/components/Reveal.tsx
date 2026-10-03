import { useEffect, useRef, useState, type ReactNode } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// True once the element has scrolled into view (and stays true).
// Uses IntersectionObserver: the browser tells us when an element becomes visible, without us checking on every scroll.
export function useInView<T extends Element>(threshold = 0.2) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(prefersReducedMotion)
  useEffect(() => {
    if (inView || !ref.current) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); io.disconnect() }
    }, { threshold })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [inView, threshold])
  return { ref, inView }
}

// Fades and slides its content up the first time it scrolls into view.
export function Reveal({ children, delay = 0, className = '', from = 'up' }: { children: ReactNode; delay?: number; className?: string; from?: 'up' | 'left' | 'right' | 'zoom' }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.15)
  const hidden = { up: 'translate-y-8', left: '-translate-x-10', right: 'translate-x-10', zoom: 'scale-95' }[from]
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${inView ? 'opacity-100 translate-x-0 translate-y-0 scale-100' : `opacity-0 ${hidden}`} ${className}`}>
      {children}
    </div>
  )
}
