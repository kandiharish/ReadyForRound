import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { apiFetch } from '../lib/api'
import { RoleQuiz } from '../components/RoleQuiz'
import { SkillPicker } from '../components/SkillPicker'
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

export default function Onboarding() {
  const navigate = useNavigate()
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [step, setStep] = useState(0)
  const [showQuiz, setShowQuiz] = useState(false)
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
    return <Shell>{error ? <p className="text-bad">{error}</p> : <p className="text-muted">Loading…</p>}</Shell>
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
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-accent' : 'bg-line-strong'}`} />
        ))}
      </div>
      <p className="text-xs text-muted">Step {step + 1} of {STEP_TITLES.length}</p>
      <h1 className="text-xl font-bold text-ink mt-1 mb-5">{STEP_TITLES[step]}</h1>

      {step === 0 && (showQuiz ? (
        <RoleQuiz
          roles={catalog.roles}
          onPick={(id) => { set('target_role', id); setShowQuiz(false) }}
          onCancel={() => setShowQuiz(false)}
        />
      ) : (
        <>
          <Choices options={catalog.roles} value={answers.target_role} onChange={(v) => set('target_role', v)} />
          <button onClick={() => setShowQuiz(true)} className="mt-4 text-accent-deep font-medium text-sm">
            Not sure? Take a 1-minute quiz
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
          <p className="text-sm text-muted mb-4">
            Search and add the skills you know{role ? ` (with suggestions for ${role.label})` : ''}. You'll rate each one as you add it.
            Your interviews will show how your rating compares with what you can prove.
          </p>
          <SkillPicker skills={answers.skills} onChange={(next) => set('skills', next)} suggested={role?.skills ?? []} />
        </>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <div>
            <p className="font-medium text-ink mb-2">Interviewer speaking speed</p>
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
              <span className="font-medium text-ink">Practise without scores</span>
              <span className="block text-sm text-muted">
                Get feedback but no numbers, so you can relax while you build confidence. You can change this later.
              </span>
            </span>
          </label>
        </div>
      )}

      {error && <p className="text-sm text-bad mt-4">{error}</p>}

      <div className="flex justify-between mt-8">
        <button onClick={() => setStep(step - 1)} disabled={step === 0}
          className="text-soft px-4 py-2 disabled:invisible">
          ← Back
        </button>
        {step < STEP_TITLES.length - 1 ? (
          <button onClick={() => setStep(step + 1)} disabled={!canContinue}
            className="bg-accent text-on-accent rounded-lg px-5 py-2 font-medium disabled:opacity-40">
            Continue
          </button>
        ) : (
          <button onClick={finish} disabled={saving}
            className="bg-accent text-on-accent rounded-lg px-5 py-2 font-medium disabled:opacity-40">
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
      <div className="bg-card border border-line rounded-2xl p-6 sm:p-8 max-w-lg w-full">
        <p className="text-sm font-semibold text-accent-deep mb-4">ReadyForRound</p>
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
            ? 'border-accent bg-accent-soft ring-1 ring-accent' : 'border-line-strong hover:border-accent'}`}>
          <span className="font-medium text-ink">{o.label}</span>
          {o.description && <span className="block text-sm text-muted">{o.description}</span>}
        </button>
      ))}
    </div>
  )
}
