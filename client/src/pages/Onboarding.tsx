import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { apiFetch } from '../lib/api'
import { RoleQuiz } from '../components/RoleQuiz'
import type { Catalog, Option, Profile } from '../types'

type Answers = {
  target_role: string | null
  experience_level: string | null
  target_company_type: string | null
  placement_timeline: string | null
  skills: Record<string, number> // skill name -> self rating 1..5
  speaking_pace: 'slow' | 'normal'
  practice_without_score: boolean
}

const STEP_TITLES = [
  'Which role are you preparing for?',
  'Where are you in your journey?',
  'What kind of company are you aiming for?',
  'When is your placement or interview?',
  'Which skills do you know?',
  'How would you like to practise?',
]

const RATING_LABELS = ['', 'Just started', 'Basic', 'Comfortable', 'Good', 'Expert']

export default function Onboarding() {
  const navigate = useNavigate()
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [step, setStep] = useState(0)
  const [showQuiz, setShowQuiz] = useState(false)
  const [customSkill, setCustomSkill] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Answers>({
    target_role: null,
    experience_level: null,
    target_company_type: null,
    placement_timeline: null,
    skills: {},
    speaking_pace: 'normal',
    practice_without_score: false,
  })

  // Load the option lists, and pre-fill answers if the student is editing an existing profile.
  useEffect(() => {
    Promise.all([apiFetch<Catalog>('/catalog'), apiFetch<Profile>('/me')])
      .then(([cat, me]) => {
        setCatalog(cat)
        if (me.onboarding_completed) {
          setAnswers({
            target_role: me.target_role,
            experience_level: me.experience_level,
            target_company_type: me.target_company_type,
            placement_timeline: me.placement_timeline,
            skills: Object.fromEntries(me.user_skills.map((s) => [s.skill, s.self_rating])),
            speaking_pace: me.speaking_pace,
            practice_without_score: me.practice_without_score,
          })
        }
      })
      .catch((err) => setError(err.message))
  }, [])

  if (!catalog) {
    return <Shell>{error ? <p className="text-rose">{error}</p> : <p className="text-muted">Loading…</p>}</Shell>
  }

  const set = <K extends keyof Answers>(key: K, value: Answers[K]) => setAnswers((a) => ({ ...a, [key]: value }))
  const role = catalog.roles.find((r) => r.id === answers.target_role)

  const canContinue = [
    !!answers.target_role,
    !!answers.experience_level,
    !!answers.target_company_type,
    !!answers.placement_timeline,
    Object.keys(answers.skills).length > 0,
    true,
  ][step]

  function toggleSkill(skill: string) {
    const next = { ...answers.skills }
    if (next[skill]) delete next[skill]
    else next[skill] = 3 // start in the middle; the student adjusts it
    set('skills', next)
  }

  function addCustomSkill() {
    const skill = customSkill.trim()
    if (skill && !answers.skills[skill]) set('skills', { ...answers.skills, [skill]: 3 })
    setCustomSkill('')
  }

  async function finish() {
    setSaving(true)
    setError(null)
    try {
      await apiFetch('/onboarding', {
        method: 'PUT',
        body: JSON.stringify({
          ...answers,
          skills: Object.entries(answers.skills).map(([skill, self_rating]) => ({ skill, self_rating })),
        }),
      })
      navigate('/home')
    } catch (err) {
      setError((err as Error).message)
      setSaving(false)
    }
  }

  return (
    <Shell>
      {/* Progress bar */}
      <div className="flex gap-1 mb-6">
        {STEP_TITLES.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-lime' : 'bg-line-strong'}`} />
        ))}
      </div>
      <p className="text-xs text-muted">Step {step + 1} of {STEP_TITLES.length}</p>
      <h1 className="text-xl font-bold text-fg mt-1 mb-5">{STEP_TITLES[step]}</h1>

      {step === 0 && (showQuiz ? (
        <RoleQuiz
          roles={catalog.roles}
          onPick={(id) => { set('target_role', id); setShowQuiz(false) }}
          onCancel={() => setShowQuiz(false)}
        />
      ) : (
        <>
          <Choices options={catalog.roles} value={answers.target_role} onChange={(v) => set('target_role', v)} />
          <button onClick={() => setShowQuiz(true)} className="mt-4 text-lime font-medium text-sm">
            🤔 Not sure? Take a 1-minute quiz
          </button>
        </>
      ))}

      {step === 1 && (
        <Choices options={catalog.experienceLevels} value={answers.experience_level} onChange={(v) => set('experience_level', v)} />
      )}

      {step === 2 && (
        <Choices options={catalog.companyTypes} value={answers.target_company_type} onChange={(v) => set('target_company_type', v)} />
      )}

      {step === 3 && (
        <Choices options={catalog.placementTimelines} value={answers.placement_timeline} onChange={(v) => set('placement_timeline', v)} />
      )}

      {step === 4 && (
        <>
          <p className="text-sm text-muted mb-3">
            Tap the skills you know{role ? ` for ${role.label}` : ''}, then rate yourself honestly.
            Your interviews will show how your rating compares with what you can prove.
          </p>
          <div className="flex flex-wrap gap-2">
            {[...new Set([...(role?.skills ?? []), ...Object.keys(answers.skills)])].map((skill) => (
              <button key={skill} onClick={() => toggleSkill(skill)}
                className={`px-3 py-1.5 rounded-full border text-sm ${answers.skills[skill]
                  ? 'bg-lime border-lime text-white' : 'border-line-strong text-soft hover:border-lime'}`}>
                {skill}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <input value={customSkill} onChange={(e) => setCustomSkill(e.target.value)} placeholder="Add another skill"
              onKeyDown={(e) => e.key === 'Enter' && addCustomSkill()} maxLength={40}
              className="flex-1 border border-line-strong rounded-lg px-3 py-1.5 text-sm" />
            <button onClick={addCustomSkill} className="text-sm border border-line-strong rounded-lg px-3">Add</button>
          </div>

          {Object.keys(answers.skills).length > 0 && (
            <div className="mt-5 space-y-3">
              {Object.entries(answers.skills).map(([skill, rating]) => (
                <div key={skill} className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-fg w-28 shrink-0">{skill}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => set('skills', { ...answers.skills, [skill]: n })} title={RATING_LABELS[n]}
                        className={`w-8 h-8 rounded-md text-sm ${n <= rating ? 'bg-lime text-ink-900' : 'bg-ink-750 text-muted'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-muted w-24 text-right hidden sm:block">{RATING_LABELS[rating]}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <div>
            <p className="font-medium text-fg mb-2">Interviewer speaking speed</p>
            <Choices
              options={[
                { id: 'normal', label: 'Normal speed' },
                { id: 'slow', label: 'Slower', description: 'Helpful if English is not your first language' },
              ]}
              value={answers.speaking_pace}
              onChange={(v) => set('speaking_pace', v as 'slow' | 'normal')}
            />
          </div>
          <label className="flex items-start gap-3 border border-line-strong rounded-lg p-3 cursor-pointer">
            <input type="checkbox" className="mt-1" checked={answers.practice_without_score}
              onChange={(e) => set('practice_without_score', e.target.checked)} />
            <span>
              <span className="font-medium text-fg">Practise without scores</span>
              <span className="block text-sm text-muted">
                Get feedback but no numbers, so you can relax while you build confidence. You can change this later.
              </span>
            </span>
          </label>
        </div>
      )}

      {error && <p className="text-sm text-rose mt-4">{error}</p>}

      <div className="flex justify-between mt-8">
        <button onClick={() => setStep(step - 1)} disabled={step === 0}
          className="text-soft px-4 py-2 disabled:invisible">
          ← Back
        </button>
        {step < STEP_TITLES.length - 1 ? (
          <button onClick={() => setStep(step + 1)} disabled={!canContinue}
            className="bg-lime text-ink-900 rounded-lg px-5 py-2 font-medium disabled:opacity-40">
            Continue
          </button>
        ) : (
          <button onClick={finish} disabled={saving}
            className="bg-lime text-ink-900 rounded-lg px-5 py-2 font-medium disabled:opacity-40">
            {saving ? 'Saving…' : 'Finish'}
          </button>
        )}
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen flex items-start sm:items-center justify-center p-4">
      <div className="bg-ink-800 border border-line rounded-2xl p-6 sm:p-8 max-w-lg w-full">
        <p className="text-sm font-semibold text-lime mb-4">ReadyForRound</p>
        {children}
      </div>
    </main>
  )
}

// A list of clickable option cards; the chosen one is highlighted.
function Choices({ options, value, onChange }: { options: Option[]; value: string | null; onChange: (id: string) => void }) {
  return (
    <div className="space-y-2">
      {options.map((o) => (
        <button key={o.id} onClick={() => onChange(o.id)}
          className={`w-full text-left border rounded-lg px-4 py-3 ${value === o.id
            ? 'border-lime bg-lime-deep ring-1 ring-lime' : 'border-line-strong hover:border-lime'}`}>
          <span className="font-medium text-fg">{o.label}</span>
          {o.description && <span className="block text-sm text-muted">{o.description}</span>}
        </button>
      ))}
    </div>
  )
}
