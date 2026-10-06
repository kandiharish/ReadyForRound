import { useEffect, useRef, useState } from 'react'
import { useFeedback } from './Feedback'
import { Button, Icon } from './ui'

// Share card: a 1200x630 image (the size LinkedIn and WhatsApp previews use) drawn in the browser
// with <canvas>, so it costs nothing to make. Shared through the phone's share sheet, or downloaded.

export type ShareData = {
  kicker: string // e.g. "Mock interview progress"
  headline: string // e.g. "Interview-ready for Frontend Developer"
  score: number // 0-100
  scoreLabel: string // under the number: "ready" or "out of 100"
  percent: boolean // show "%" after the number
  name: string | null
  detail: string | null // e.g. "Final year student"
  chips: string[] // e.g. ["12 interviews", "5-day streak"]
  rounds: { label: string; score: number }[] // up to 3 shown
  caption: string // suggested post text
}

const W = 1200, H = 630
const SITE = 'ready-for-round.vercel.app'
const SANS = '"Geist", system-ui, sans-serif'
const SERIF = '"Cormorant Garamond", Georgia, serif'

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word } else line = test
  }
  if (line) lines.push(line)
  return lines
}

function pill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

async function draw(canvas: HTMLCanvasElement, d: ShareData, showName: boolean) {
  // Make sure the page fonts are ready, or the canvas falls back to a plain font
  await Promise.all([document.fonts.load(`600 60px ${SERIF}`), document.fonts.load(`700 30px ${SANS}`), document.fonts.load(`500 20px ${SANS}`)]).catch(() => {})
  const logo = await new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = '/logo-mark.png'
  })

  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Soft pastel background with two gentle colour blobs
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#f1edff')
  bg.addColorStop(0.55, '#e7f1fc')
  bg.addColorStop(1, '#e4f4ea')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  const blob = (x: number, y: number, r: number, color: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, color)
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
  blob(1080, 60, 320, 'rgba(251,207,224,0.75)')
  blob(80, 600, 300, 'rgba(186,230,253,0.7)')

  // Brand
  if (logo) ctx.drawImage(logo, 64, 52, 48, 48)
  ctx.font = `700 30px ${SANS}`
  ctx.textBaseline = 'middle'
  let x = logo ? 124 : 64
  for (const [part, color] of [['Ready', '#0f172a'], ['For', '#3354d6'], ['Round', '#0f172a']] as const) {
    ctx.fillStyle = color
    ctx.fillText(part, x, 77)
    x += ctx.measureText(part).width
  }

  // Left column: kicker, headline, name, chips
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#5944ad'
  ctx.font = `700 17px ${SANS}`
  ctx.letterSpacing = '3px'
  ctx.fillText(d.kicker.toUpperCase(), 64, 190)
  ctx.letterSpacing = '0px'

  ctx.fillStyle = '#0f172a'
  ctx.font = `600 62px ${SERIF}`
  const lines = wrap(ctx, d.headline, 640).slice(0, 3)
  lines.forEach((l, i) => ctx.fillText(l, 64, 258 + i * 64))
  let y = 258 + (lines.length - 1) * 64

  const who = [showName ? d.name : null, d.detail].filter(Boolean).join(' · ')
  if (who) {
    ctx.fillStyle = '#334155'
    ctx.font = `500 22px ${SANS}`
    ctx.fillText(who, 64, y + 52)
    y += 52
  }

  ctx.font = `600 19px ${SANS}`
  let cx = 64
  const chipY = Math.max(y + 36, 430)
  for (const chip of d.chips.slice(0, 3)) {
    const w = ctx.measureText(chip).width + 36
    if (cx + w > 720) break
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    pill(ctx, cx, chipY, w, 46, 23)
    ctx.fill()
    ctx.fillStyle = '#1e293b'
    ctx.fillText(chip, cx + 18, chipY + 30)
    cx += w + 12
  }

  // Footer
  ctx.fillStyle = '#5a6577'
  ctx.font = `500 20px ${SANS}`
  ctx.fillText(`Free AI mock interviews · ${SITE}`, 64, 584)

  // Right column: score ring
  const rx = 940, ry = 270, r = 138
  ctx.lineCap = 'round'
  ctx.lineWidth = 26
  ctx.strokeStyle = 'rgba(51,84,214,0.12)'
  ctx.beginPath()
  ctx.arc(rx, ry, r, 0, Math.PI * 2)
  ctx.stroke()
  const ring = ctx.createLinearGradient(rx - r, ry - r, rx + r, ry + r)
  ring.addColorStop(0, '#12a8f0')
  ring.addColorStop(1, '#7b3cf0')
  ctx.strokeStyle = ring
  ctx.beginPath()
  ctx.arc(rx, ry, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * Math.max(0.02, Math.min(1, d.score / 100))))
  ctx.stroke()
  ctx.textAlign = 'center'
  ctx.fillStyle = '#0f172a'
  ctx.font = `800 92px ${SANS}`
  const numWidth = ctx.measureText(String(d.score)).width
  ctx.fillText(String(d.score), d.percent ? rx - 10 : rx, ry + 22)
  if (d.percent) {
    ctx.font = `700 34px ${SANS}`
    ctx.fillStyle = '#5944ad'
    ctx.textAlign = 'left'
    ctx.fillText('%', rx - 10 + numWidth / 2 + 4, ry + 18)
    ctx.textAlign = 'center'
  }
  ctx.font = `600 20px ${SANS}`
  ctx.fillStyle = '#5a6577'
  ctx.fillText(d.scoreLabel, rx, ry + 62)
  ctx.textAlign = 'left'

  // Round scores under the ring
  d.rounds.slice(0, 3).forEach((rd, i) => {
    const top = 468 + i * 40
    ctx.font = `600 17px ${SANS}`
    ctx.fillStyle = '#334155'
    ctx.fillText(rd.label, 790, top + 6)
    ctx.textAlign = 'right'
    ctx.fillText(String(rd.score), 1120, top + 6)
    ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    pill(ctx, 790, top + 14, 330, 9, 5)
    ctx.fill()
    const g = ctx.createLinearGradient(790, 0, 1120, 0)
    g.addColorStop(0, '#12a8f0')
    g.addColorStop(1, '#7b3cf0')
    ctx.fillStyle = g
    pill(ctx, 790, top + 14, Math.max(10, 330 * (rd.score / 100)), 9, 5)
    ctx.fill()
  })
}

export function ShareButton({ data, className = '' }: { data: ShareData; className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 min-h-9 px-3 rounded-full text-sm font-semibold bg-linear-to-r from-lavender to-sky text-lavender-ink border border-lavender-ink/15 hover:shadow-md hover:-translate-y-px transition-all ${className}`}>
        <Icon name="share" size={15} /> Share progress
      </button>
      {open && <ShareDialog data={data} onClose={() => setOpen(false)} />}
    </>
  )
}

function ShareDialog({ data, onClose }: { data: ShareData; onClose: () => void }) {
  const { toast } = useFeedback()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showName, setShowName] = useState(!!data.name)
  const [caption, setCaption] = useState(`${data.caption}\n\n${SITE}`)
  const [ready, setReady] = useState(false)

  // Redraw only when the card's content changes, not on every re-render of the page behind it
  const dataKey = JSON.stringify(data)
  useEffect(() => {
    let live = true
    setReady(false)
    if (canvasRef.current) void draw(canvasRef.current, JSON.parse(dataKey) as ShareData, showName).then(() => { if (live) setReady(true) })
    return () => { live = false }
  }, [dataKey, showName])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const toBlob = () => new Promise<Blob | null>((resolve) => canvasRef.current?.toBlob(resolve, 'image/png') ?? resolve(null))

  async function download() {
    const blob = await toBlob()
    if (!blob) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'readyforround-progress.png'
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
  }

  async function shareNative() {
    const blob = await toBlob()
    if (!blob) return
    const file = new File([blob], 'readyforround-progress.png', { type: 'image/png' })
    try {
      await navigator.share({ files: [file], text: caption })
    } catch (err) {
      if ((err as Error).name !== 'AbortError') toast("Couldn't open sharing. Download the image instead.", 'error')
    }
  }

  async function copyCaption() {
    await navigator.clipboard.writeText(caption).then(() => toast('Caption copied', 'success')).catch(() => toast("Couldn't copy. Select the text and copy it.", 'error'))
  }

  // LinkedIn opens a new post with the caption filled in; the image is added from the download.
  async function linkedIn() {
    await download()
    window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(caption)}`, '_blank', 'noopener')
    toast('Image downloaded. Add it to your LinkedIn post with the photo button.', 'success')
  }

  const canShareFiles = typeof navigator !== 'undefined' && !!navigator.canShare?.({ files: [new File([''], 'x.png', { type: 'image/png' })] })

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-[#0b1020]/50 backdrop-blur-sm" />
      <div role="dialog" aria-modal="true" aria-labelledby="share-title"
        className="relative w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl bg-card border border-line p-5 sm:p-6 shadow-2xl animate-[toast-in_0.2s_ease-out] max-h-[92vh] overflow-auto space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="share-title" className="font-display font-semibold text-3xl">Share your progress</h2>
            <p className="text-sm text-muted mt-1">A ready-made image for LinkedIn, WhatsApp or Instagram. Nothing is posted until you do it.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="w-9 h-9 shrink-0 rounded-full hover:bg-raised flex items-center justify-center text-muted">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-line shadow-sm bg-raised aspect-[1200/630]">
          <canvas ref={canvasRef} className={`w-full h-full transition-opacity ${ready ? 'opacity-100' : 'opacity-0'}`} aria-label={`Share image: ${data.headline}, ${data.score}${data.percent ? '%' : ''} ${data.scoreLabel}`} role="img" />
          {!ready && <div className="absolute inset-0 skeleton" />}
        </div>

        {data.name && (
          <label className="flex items-center gap-2 text-sm text-soft cursor-pointer w-fit">
            <input type="checkbox" checked={showName} onChange={(e) => setShowName(e.target.checked)} className="w-4 h-4 accent-[var(--accent)]" />
            Show my name on the image
          </label>
        )}

        <div>
          <label htmlFor="share-caption" className="text-sm font-medium">Caption</label>
          <textarea id="share-caption" value={caption} onChange={(e) => setCaption(e.target.value)} rows={4}
            className="mt-1.5 w-full rounded-xl border border-line-strong bg-card p-3 text-sm leading-relaxed focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
        </div>

        <div className="flex flex-wrap gap-2">
          {canShareFiles && <Button onClick={shareNative} disabled={!ready}><Icon name="share" size={16} /> Share</Button>}
          <Button onClick={linkedIn} disabled={!ready} variant={canShareFiles ? 'secondary' : 'primary'}>
            Post on LinkedIn
          </Button>
          <Button onClick={download} disabled={!ready} variant="secondary"><Icon name="download" size={16} /> Download image</Button>
          <Button onClick={copyCaption} variant="secondary">Copy caption</Button>
        </div>
      </div>
    </div>
  )
}
