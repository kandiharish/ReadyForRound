import { useEffect, useRef, useState } from 'react'

export const INTRO_VIDEO_URL = '/intro.mp4' // put the video file at client/public/intro.mp4
const SEEN_KEY = 'rfr-intro-seen'

// Is the intro video actually there? (If the file is missing, the server sends back the web page instead.)
export async function introVideoExists() {
  try {
    const res = await fetch(INTRO_VIDEO_URL, { method: 'HEAD' })
    return res.ok && (res.headers.get('content-type') ?? '').startsWith('video/')
  } catch {
    return false
  }
}

// True the very first time someone opens the site in this browser.
export function isFirstVisit() {
  try { return !localStorage.getItem(SEEN_KEY) } catch { return false }
}

export function markIntroSeen() {
  try { localStorage.setItem(SEEN_KEY, '1') } catch { /* fine */ }
}

// Full-screen pop-up that plays the intro video.
// Browsers only allow autoplay without sound, so it starts muted with a big "Turn sound on" button.
export function IntroVideo({ onClose }: { onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    markIntroSeen()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function soundOn() {
    const v = videoRef.current
    if (!v) return
    v.muted = false
    v.currentTime = 0 // start again so they hear it from the beginning
    v.play().catch(() => {})
    setMuted(false)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" aria-label="Close intro video" onClick={onClose} className="absolute inset-0 bg-[#0b1020]/80 backdrop-blur-sm" />
      <div role="dialog" aria-modal="true" aria-label="ReadyForRound intro video"
        className="relative w-full max-w-4xl animate-[toast-in_0.2s_ease-out]">
        <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl ring-1 ring-white/10">
          <video ref={videoRef} src={INTRO_VIDEO_URL} autoPlay muted playsInline controls
            onEnded={onClose} className="w-full max-h-[78vh] block bg-black" />
          {muted && (
            <button type="button" onClick={soundOn}
              className="absolute left-1/2 top-4 -translate-x-1/2 inline-flex items-center gap-2 rounded-full bg-white/95 text-[#0b1020] px-4 py-2 text-sm font-semibold shadow-lg hover:bg-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4zM17 9a4 4 0 0 1 0 6M19.5 6.5a8 8 0 0 1 0 11" /></svg>
              Turn sound on
            </button>
          )}
        </div>
        <div className="flex justify-end mt-3">
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10">
            Skip intro
          </button>
        </div>
      </div>
    </div>
  )
}
