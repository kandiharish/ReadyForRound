import { useEffect, useRef } from 'react'
import { LAND_DOTS } from '../lib/globeDots'

// A slowly turning globe drawn from dots on land, with India highlighted and arcs that travel from India to
// cities around the world. Plain canvas (no 3D library): each dot is placed on a sphere, turned, and drawn
// with the near side brighter than the far side. It pauses when off-screen, and stays still for reduced motion.

const INDIA = [12.97, 77.59] as const // Bengaluru
const CITIES: [number, number][] = [
  [37.77, -122.42], // San Francisco
  [51.51, -0.13], // London
  [1.35, 103.82], // Singapore
  [25.2, 55.27], // Dubai
  [-33.87, 151.21], // Sydney
  [52.52, 13.4], // Berlin
  [43.65, -79.38], // Toronto
  [35.68, 139.69], // Tokyo
]
const rad = (d: number) => (d * Math.PI) / 180
const inIndia = (lat: number, lon: number) => lat > 6 && lat < 36 && lon > 68 && lon < 97.5

type V = [number, number, number]
const toVec = (lat: number, lon: number): V => {
  const la = rad(lat), lo = rad(lon)
  return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)]
}
// Spherical interpolation between two points on the globe
function slerp(a: V, b: V, t: number): V {
  const d = Math.acos(Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])))
  if (d < 1e-6) return a
  const s = Math.sin(d), wa = Math.sin((1 - t) * d) / s, wb = Math.sin(t * d) / s
  return [a[0] * wa + b[0] * wb, a[1] * wa + b[1] * wb, a[2] * wa + b[2] * wb]
}

export function Globe({ className = '' }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const ctx = el.getContext('2d')
    if (!ctx) return
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    const dots: { v: V; india: boolean }[] = []
    for (let i = 0; i < LAND_DOTS.length; i += 2) dots.push({ v: toVec(LAND_DOTS[i], LAND_DOTS[i + 1]), india: inIndia(LAND_DOTS[i], LAND_DOTS[i + 1]) })
    const home = toVec(INDIA[0], INDIA[1])
    const arcs = CITIES.map((c, i) => ({ to: toVec(c[0], c[1]), offset: i / CITIES.length }))

    let w = 0, h = 0, dpr = 1
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1)
      w = el.clientWidth; h = el.clientHeight
      el.width = Math.round(w * dpr); el.height = Math.round(h * dpr)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)

    const css = getComputedStyle(document.documentElement)
    const colour = (name: string) => css.getPropertyValue(name).trim() || '#0b63e5'
    const tilt = rad(-14) // lean the north pole away a little, like a desk globe

    let raf = 0, visible = true, start = performance.now()
    const draw = (now: number) => {
      const t = (now - start) / 1000
      const ink = colour('--ink'), accent = colour('--accent')
      const spin = rad(-78) - t * 0.09 // starts with India facing us, turns slowly
      const r = Math.min(w, h) * 0.46, cx = w / 2, cy = h / 2
      const cs = Math.cos(spin), sn = Math.sin(spin), ct = Math.cos(tilt), st = Math.sin(tilt)
      const turn = (v: V): V => {
        const x = v[0] * cs + v[2] * sn, z = -v[0] * sn + v[2] * cs
        return [x, v[1] * ct - z * st, v[1] * st + z * ct]
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      // The sphere: a soft shaded disc and a fine rim, so it reads as a ball rather than a flat circle
      const shade = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r)
      shade.addColorStop(0, 'rgba(11,99,229,0.07)')
      shade.addColorStop(1, 'rgba(11,99,229,0.015)')
      ctx.fillStyle = shade
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = 'rgba(11,99,229,0.18)'; ctx.lineWidth = 1
      ctx.stroke()

      // Land dots: brighter and larger on the near side
      for (const d of dots) {
        const p = turn(d.v)
        if (p[2] < -0.05) continue
        const depth = Math.max(0, p[2])
        ctx.globalAlpha = d.india ? 0.95 : 0.16 + depth * 0.55
        ctx.fillStyle = d.india ? accent : ink
        const size = (d.india ? 1.9 : 1.25) * (0.7 + depth * 0.5)
        ctx.beginPath(); ctx.arc(cx + p[0] * r, cy - p[1] * r, size, 0, Math.PI * 2); ctx.fill()
      }

      // Arcs from India: a line lifts off the globe and a bright pulse travels along it
      ctx.lineCap = 'round'
      for (const a of arcs) {
        const steps = 40
        const pts: { x: number; y: number; z: number }[] = []
        for (let i = 0; i <= steps; i++) {
          const k = i / steps
          const v = slerp(home, a.to, k)
          const lift = 1 + 0.22 * Math.sin(Math.PI * k)
          const p = turn(v)
          pts.push({ x: cx + p[0] * r * lift, y: cy - p[1] * r * lift, z: p[2] })
        }
        ctx.globalAlpha = 1
        for (let i = 1; i < pts.length; i++) {
          if (pts[i].z < -0.1) continue
          ctx.strokeStyle = `rgba(11,99,229,${0.12 + Math.max(0, pts[i].z) * 0.25})`
          ctx.lineWidth = 1
          ctx.beginPath(); ctx.moveTo(pts[i - 1].x, pts[i - 1].y); ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke()
        }
        const phase = (t * 0.22 + a.offset) % 1
        const head = Math.floor(phase * steps)
        for (let i = Math.max(1, head - 6); i <= head; i++) {
          if (pts[i].z < -0.1) continue
          ctx.strokeStyle = `rgba(0,184,245,${(1 - (head - i) / 7) * 0.95})`
          ctx.lineWidth = 2
          ctx.beginPath(); ctx.moveTo(pts[i - 1].x, pts[i - 1].y); ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke()
        }
      }
      // India glows softly
      const hp = turn(home)
      if (hp[2] > 0) {
        const pulse = (t % 2.4) / 2.4
        ctx.globalAlpha = 1 - pulse
        ctx.strokeStyle = accent; ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.arc(cx + hp[0] * r, cy - hp[1] * r, 3 + pulse * 14, 0, Math.PI * 2); ctx.stroke()
        ctx.globalAlpha = 1; ctx.fillStyle = accent
        ctx.beginPath(); ctx.arc(cx + hp[0] * r, cy - hp[1] * r, 3.2, 0, Math.PI * 2); ctx.fill()
      }
      ctx.globalAlpha = 1

      if (!still && visible && !document.hidden) raf = requestAnimationFrame(draw)
    }

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      cancelAnimationFrame(raf)
      if (visible) raf = requestAnimationFrame(draw)
    })
    io.observe(el)
    const onVis = () => { cancelAnimationFrame(raf); if (!document.hidden && visible) raf = requestAnimationFrame(draw) }
    document.addEventListener('visibilitychange', onVis)
    // Redraw once when the theme changes (dot colours come from the theme)
    const mo = new MutationObserver(() => { if (still) raf = requestAnimationFrame(draw) })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    raf = requestAnimationFrame(draw)
    start = performance.now()

    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); mo.disconnect(); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  return <canvas ref={canvas} aria-hidden="true" className={`block w-full h-full ${className}`} />
}
