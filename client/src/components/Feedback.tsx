import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

// In-app notifications, instead of the browser's own popups:
//   toast("Profile saved")                      -> a small message in the corner that disappears by itself
//   await confirm({ title, body, confirmLabel }) -> our own styled "Are you sure?" dialog (true / false)

type Tone = 'success' | 'info' | 'warning' | 'error'
type Toast = { id: number; message: string; tone: Tone }
type ConfirmOptions = { title: string; body?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean }

type FeedbackApi = {
  toast: (message: string, tone?: Tone) => void
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const FeedbackContext = createContext<FeedbackApi | null>(null)

const TONES: Record<Tone, { box: string; icon: string }> = {
  success: { box: 'bg-sage text-sage-ink border-sage-ink/25', icon: 'M5 12l5 5L20 7' },
  info: { box: 'bg-sky text-sky-ink border-sky-ink/25', icon: 'M12 11v6M12 7.5h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z' },
  warning: { box: 'bg-peach text-peach-ink border-peach-ink/25', icon: 'M12 8v5M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z' },
  error: { box: 'bg-blush text-blush-ink border-blush-ink/25', icon: 'M12 8v5M12 17h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z' },
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null)
  const nextId = useRef(1)

  const toast = useCallback((message: string, tone: Tone = 'success') => {
    const id = nextId.current++
    setToasts((t) => [...t.slice(-3), { id, message, tone }]) // show at most 4 at once
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'error' ? 6000 : 3500)
  }, [])

  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => setDialog({ ...options, resolve })), [])

  const close = (ok: boolean) => {
    dialog?.resolve(ok)
    setDialog(null)
  }

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toasts: bottom-right on desktop, above the tab bar on phones. aria-live reads them out to screen readers. */}
      <div aria-live="polite" className="fixed z-50 right-4 bottom-24 lg:bottom-6 flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} role="status"
            className={`pointer-events-auto flex items-center gap-2.5 max-w-sm rounded-xl border px-4 py-3 text-sm font-medium shadow-lg animate-[toast-in_0.2s_ease-out] ${TONES[t.tone].box}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
              <path d={TONES[t.tone].icon} />
            </svg>
            {t.message}
          </div>
        ))}
      </div>

      {dialog && <ConfirmDialog {...dialog} onClose={close} />}
    </FeedbackContext.Provider>
  )
}

function ConfirmDialog({ title, body, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger, onClose }: ConfirmOptions & { onClose: (ok: boolean) => void }) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  // Focus the main button when it opens; Escape cancels (only while the dialog is open).
  useEffect(() => {
    confirmRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Close" onClick={() => onClose(false)} className="absolute inset-0 bg-[#0b1020]/45 backdrop-blur-[2px]" />
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title"
        className="relative w-full max-w-sm rounded-2xl bg-card border border-line shadow-2xl p-6 animate-[toast-in_0.15s_ease-out]">
        <h2 id="confirm-title" className="font-display font-semibold text-2xl text-ink">{title}</h2>
        {body && <p className="text-sm text-muted mt-2 leading-relaxed">{body}</p>}
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={() => onClose(false)}
            className="min-h-11 px-4 rounded-xl border border-line-strong text-ink font-medium hover:bg-raised">{cancelLabel}</button>
          <button ref={confirmRef} type="button" onClick={() => onClose(true)}
            className={`min-h-11 px-4 rounded-xl font-semibold ${danger ? 'bg-bad text-white hover:opacity-90' : 'bg-accent text-on-accent hover:bg-accent-hover'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext)
  if (!ctx) throw new Error('useFeedback must be used inside <FeedbackProvider>')
  return ctx
}
