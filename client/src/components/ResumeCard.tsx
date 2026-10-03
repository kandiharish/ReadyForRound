import { useEffect, useRef, useState } from 'react'
import { apiFetch } from '../lib/api'
import { useFeedback } from './Feedback'
import { Button, Card, Icon } from './ui'
import { Bone, Lines } from './Skeleton'

export type ResumeSummary = {
  headline: string
  skills: string[]
  projects: { name: string; tech: string[]; summary: string }[]
  experience: { role: string; organisation: string; summary: string }[]
  education: string
}
export type Resume = { fileName: string; summary: ResumeSummary; updatedAt: string }

const MAX_BYTES = 2 * 1024 * 1024

// Upload a resume (PDF). The interviewer then asks about the candidate's own projects and experience.
// The file itself is never stored: the server keeps only the text and a short summary.
export function ResumeCard({ onChange }: { onChange?: (resume: Resume | null) => void }) {
  const { toast, confirm } = useFeedback()
  const [resume, setResume] = useState<Resume | null | undefined>(undefined) // undefined = still loading
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    apiFetch<Resume | null>('/resume').then((r) => { setResume(r); onChange?.(r) }).catch(() => setResume(null))
  }, [onChange])

  async function upload(file: File) {
    setError(null)
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) return setError('Please choose a PDF file.')
    if (file.size > MAX_BYTES) return setError('That file is too large. Please upload a PDF under 2 MB.')
    setBusy(true)
    try {
      const pdf = new Blob([file], { type: 'application/pdf' })
      const r = await apiFetch<Resume>('/resume', { method: 'POST', body: pdf, headers: { 'X-File-Name': encodeURIComponent(file.name) } })
      setResume(r)
      onChange?.(r)
      toast('Resume added. Your next interview will ask about it.', 'success')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function remove() {
    const ok = await confirm({ title: 'Remove your resume?', body: 'Interviews will go back to general questions for your role.', confirmLabel: 'Remove', danger: true })
    if (!ok) return
    await apiFetch('/resume', { method: 'DELETE' })
    setResume(null)
    onChange?.(null)
    toast('Resume removed')
  }

  const picker = (
    <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden"
      onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f) }} />
  )

  return (
    <Card className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-peach text-peach-ink flex items-center justify-center"><Icon name="file" size={16} /></span>
            Resume
          </h2>
          <p className="text-sm text-muted mt-1">
            Add your resume and the interviewer will ask about your own projects, skills and experience, just like a real interview.
          </p>
        </div>
        {resume && !busy && (
          <div className="flex gap-2 shrink-0">
            <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>Replace</Button>
            <Button type="button" variant="ghost" onClick={remove}>Remove</Button>
          </div>
        )}
      </div>
      {picker}

      {resume === undefined ? <Lines count={3} /> : busy ? (
        <div className="rounded-2xl border border-line p-5 space-y-4" role="status">
          <p className="text-sm text-muted"><b className="text-ink">Reading your resume…</b> Finding your projects, skills and experience. This takes about 20 seconds.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-xl bg-card border border-line p-3 space-y-2.5">
                <Bone className="h-3.5 w-32" /><Bone className="h-3 w-24" /><Lines count={2} />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">{[56, 72, 48, 88, 64].map((w, i) => <Bone key={i} className="h-6" style={{ width: w }} />)}</div>
        </div>
      ) : !resume ? (
        <button type="button" onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) upload(f) }}
          className="w-full rounded-2xl border-2 border-dashed border-line-strong hover:border-accent hover:bg-accent-soft/40 p-8 text-center transition-colors">
          <span className="mx-auto w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center"><Icon name="upload" size={22} /></span>
          <span className="block font-semibold mt-3">Upload your resume (PDF)</span>
          <span className="block text-sm text-muted mt-1">Click or drag a file here · up to 2 MB</span>
          <span className="block text-xs text-muted mt-3">We keep only the text. The file itself is deleted right after reading.</span>
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="font-medium text-ink">{resume.fileName}</span>
            <span className="text-muted">· added {new Date(resume.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          {resume.summary.headline && <p className="text-soft">{resume.summary.headline}</p>}

          {resume.summary.projects.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Projects the interviewer can ask about</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {resume.summary.projects.map((p) => (
                  <li key={p.name} className="rounded-xl bg-raised border border-line p-3">
                    <p className="font-semibold text-sm">{p.name}</p>
                    {p.tech.length > 0 && <p className="text-xs text-accent-deep mt-0.5">{p.tech.join(' · ')}</p>}
                    {p.summary && <p className="text-xs text-muted mt-1 line-clamp-2">{p.summary}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {resume.summary.experience.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Experience</p>
              <ul className="space-y-1 text-sm">
                {resume.summary.experience.map((e) => (
                  <li key={e.role + e.organisation}><b className="text-ink">{e.role}</b>{e.organisation && <span className="text-muted"> · {e.organisation}</span>}</li>
                ))}
              </ul>
            </div>
          )}

          {resume.summary.skills.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Skills on your resume</p>
              <div className="flex flex-wrap gap-1.5">
                {resume.summary.skills.map((s) => <span key={s} className="rounded-full bg-sky text-sky-ink px-2.5 py-1 text-xs font-medium">{s}</span>)}
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-bad" role="alert">{error}</p>}
    </Card>
  )
}
