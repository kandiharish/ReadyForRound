import { apiFetch } from '../lib/api'
import { Select } from '../components/Select'
import { Link } from 'react-router'
import { useEffect, useState } from 'react'
import { useMe } from '../auth/MeProvider'
import { useFeedback } from '../components/Feedback'
import { saveProfile } from '../lib/profile'
import { supabase } from '../lib/supabase'
import { loadSettings, saveSettings, type RoomSettings } from '../components/PreJoin'
import { Avatar, INTERVIEWERS, type InterviewerId } from '../components/Avatar'
import { Button, Card, ChoiceCards, Icon, PageHeader, Spinner } from '../components/ui'
import { loadVoices, pickVoice, speak } from '../lib/speech'

export default function Settings() {
  const { me, refresh } = useMe()
  const [room, setRoom] = useState<RoomSettings>(loadSettings)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const { toast } = useFeedback()

  useEffect(() => { loadVoices().then(setVoices) }, [])
  if (!me) return <Spinner />

  // Interview-room preferences live in this browser; practice preferences live in the profile.
  function updateRoom(patch: Partial<RoomSettings>) {
    const next = { ...room, ...patch }
    setRoom(next)
    saveSettings(next)
    flash()
  }
  async function updateProfile(patch: { speaking_pace?: 'slow' | 'normal'; practice_without_score?: boolean }) {
    await saveProfile(me!, patch)
    await refresh()
    flash()
  }
  function flash() {
    toast('Settings saved')
  }

  const voice = voices.find((v) => v.voiceURI === room.voiceURI) ?? pickVoice(voices, INTERVIEWERS[room.interviewer].gender)

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Settings" title="Make it yours"
 />

      <Card className="space-y-5">
        <h2 className="font-semibold">Your interviewer</h2>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          {(Object.keys(INTERVIEWERS) as InterviewerId[]).map((id) => (
            <button key={id} type="button" onClick={() => updateRoom({ interviewer: id, voiceURI: null })} aria-pressed={room.interviewer === id}
              className={`rounded-2xl border p-4 ${room.interviewer === id ? 'border-accent bg-accent-soft' : 'border-line-strong bg-raised hover:border-muted'}`}>
              <div className="w-20 h-20 mx-auto"><Avatar who={id} state="idle" /></div>
              <p className="mt-1 font-medium">{INTERVIEWERS[id].name}</p>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-2 text-sm font-medium text-soft flex-1 min-w-60 max-w-md">
            Voice
            <Select label="Interviewer voice" value={voice?.voiceURI ?? ''} onChange={(v) => updateRoom({ voiceURI: v })}
              options={voices.length === 0 ? [{ value: '', label: 'Default voice' }] : voices.map((v) => ({ value: v.voiceURI, label: v.name, hint: v.lang }))} />
          </div>
          <Button type="button" variant="secondary" onClick={() => speak(`Hello, I'm ${INTERVIEWERS[room.interviewer].name}. Ready when you are.`, voice, me.speaking_pace === 'slow' ? 0.85 : 1)}>
            Test voice
          </Button>
        </div>
        <p className="text-xs text-muted">Tip: in Microsoft Edge, voices marked "Online (Natural)" sound the most human.</p>
      </Card>

      <Card className="space-y-5">
        <h2 className="font-semibold">During the interview</h2>
        <div className="space-y-3">
          <p className="text-sm font-medium text-soft">Interviewer speaking speed</p>
          <ChoiceCards columns={2} value={me.speaking_pace} onChange={(v) => updateProfile({ speaking_pace: v })}
            options={[{ id: 'normal', label: 'Normal' }, { id: 'slow', label: 'Slower', description: 'Helpful if English is not your first language' }] as const} />
        </div>
        <div className="space-y-3">
          <p className="text-sm font-medium text-soft">Send my spoken answer</p>
          <ChoiceCards columns={2} value={String(room.autoSendSeconds) as '5' | '3' | '0'} onChange={(v) => updateRoom({ autoSendSeconds: Number(v) as 0 | 3 | 5 })}
            options={[{ id: '5', label: 'After a 5-second pause' }, { id: '3', label: 'After a 3-second pause' }, { id: '0', label: 'Only when I press "Done"' }] as const} />
        </div>
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold">Practise without scores</h2>
          <p className="text-sm text-muted mt-1 max-w-lg">Hide all numbers and keep only the feedback. Good for building confidence.</p>
        </div>
        <label className="inline-flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={me.practice_without_score} onChange={(e) => updateProfile({ practice_without_score: e.target.checked })}
            className="w-5 h-5 accent-[var(--accent-deep)]" />
          <span className="text-sm">{me.practice_without_score ? 'On' : 'Off'}</span>
        </label>
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold">Account</h2>
          <p className="text-sm text-muted mt-1">Your video is never recorded. Your answers are used only to write your feedback.</p>
        </div>
        <Button variant="secondary" onClick={() => supabase.auth.signOut()}><Icon name="logout" size={16} /> Log out</Button>
      </Card>

      <YourData />
    </div>
  )
}

// Privacy controls: download a copy of everything, or delete the account for good.
function YourData() {
  const [busy, setBusy] = useState<'export' | 'delete' | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [typed, setTyped] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function download() {
    setBusy('export')
    setError(null)
    try {
      const data = await apiFetch<unknown>('/account/export')
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
      const a = document.createElement('a')
      a.href = url
      a.download = 'readyforround-my-data.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function deleteAccount() {
    setBusy('delete')
    setError(null)
    try {
      await apiFetch('/account', { method: 'DELETE', body: JSON.stringify({ confirm: typed }) })
      await supabase.auth.signOut({ scope: 'local' })
    } catch (e) {
      setError((e as Error).message)
      setBusy(null)
    }
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-semibold">Your data</h2>
        <p className="text-sm text-muted mt-1">
          See exactly what we store in our <Link to="/privacy" className="text-accent-deep underline">privacy policy</Link>.
          You can take a copy, or delete everything.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={download} disabled={busy !== null}>{busy === 'export' ? 'Preparing…' : 'Download my data'}</Button>
        {!confirming && <Button variant="ghost" className="text-bad hover:text-bad" onClick={() => setConfirming(true)}>Delete my account</Button>}
      </div>
      {confirming && (
        <div className="rounded-xl border border-bad/40 bg-bad-soft p-4 space-y-3">
          <p className="text-sm text-ink">
            <b>This permanently deletes</b> your account, goals, interviews, reports and roadmap. It can't be undone.
          </p>
          <label className="flex flex-col gap-1.5 text-sm text-soft">
            Type DELETE to confirm
            <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off"
              className="min-h-11 max-w-60 rounded-xl bg-card border border-line-strong px-3 text-ink" />
          </label>
          <div className="flex gap-2">
            <Button className="bg-bad! text-white! hover:opacity-90" onClick={deleteAccount} disabled={typed !== 'DELETE' || busy !== null}>
              {busy === 'delete' ? 'Deleting…' : 'Delete everything'}
            </Button>
            <Button variant="ghost" onClick={() => { setConfirming(false); setTyped('') }}>Cancel</Button>
          </div>
        </div>
      )}
      {error && <p className="text-sm text-bad" role="alert">{error}</p>}
    </Card>
  )
}
