import { useState } from 'react'
import {
  EXAM_OPTIONS,
  RESOURCE_OPTIONS,
  type ExamType,
  type ResourceId,
  type StudyMode,
  type UserProfile,
  todayIsoDate,
} from './profile'

type OnboardingProps = {
  onComplete: (profile: UserProfile) => void
}

type Draft = {
  name: string
  examType: ExamType | ''
  examDate: string
  studyMode: StudyMode | ''
  hoursPerDay: number
  resources: ResourceId[]
}

const STEPS = [
  { title: 'About you', subtitle: 'Tell us who you are and what you’re preparing for.' },
  { title: 'Exam date', subtitle: 'When is your test day?' },
  { title: 'Study schedule', subtitle: 'How much time can you realistically put in each day?' },
  { title: 'Your resources', subtitle: 'Select everything you have access to.' },
]

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>({
    name: '',
    examType: '',
    examDate: '',
    studyMode: '',
    hoursPerDay: 6,
    resources: [],
  })

  const canContinue = (() => {
    switch (step) {
      case 0:
        return draft.name.trim().length > 0 && draft.examType !== ''
      case 1:
        return draft.examDate !== '' && draft.examDate >= todayIsoDate()
      case 2:
        return draft.studyMode !== '' && draft.hoursPerDay >= 1
      case 3:
        return draft.resources.length > 0
      default:
        return false
    }
  })()

  const goNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1)
      return
    }

    onComplete({
      name: draft.name.trim(),
      examType: draft.examType as ExamType,
      examDate: draft.examDate,
      studyMode: draft.studyMode as StudyMode,
      hoursPerDay: draft.hoursPerDay,
      resources: draft.resources,
      onboardingComplete: true,
    })
  }

  const toggleResource = (id: ResourceId) => {
    setDraft((d) => ({
      ...d,
      resources: d.resources.includes(id)
        ? d.resources.filter((r) => r !== id)
        : [...d.resources, id],
    }))
  }

  return (
    <div className="onboarding">
      <div className="onboarding-inner">
        <header className="onboarding-header">
          <p className="eyebrow">Step 1 Planner</p>
          <div className="step-dots" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`step-dot ${i <= step ? 'active' : ''} ${i === step ? 'current' : ''}`}
              />
            ))}
          </div>
          <h1 className="title">{STEPS[step].title}</h1>
          <p className="muted onboarding-subtitle">{STEPS[step].subtitle}</p>
        </header>

        <div className="card onboarding-card">
          {step === 0 && (
            <div className="onboarding-fields">
              <label className="field">
                <span className="field-label">Your name</span>
                <input
                  type="text"
                  className="field-input"
                  placeholder="e.g. Alex"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  autoFocus
                />
              </label>

              <fieldset className="field">
                <legend className="field-label">Which exam are you taking?</legend>
                <div className="option-group">
                  {EXAM_OPTIONS.map((opt) => (
                    <label key={opt.id} className="option-card">
                      <input
                        type="radio"
                        name="examType"
                        value={opt.id}
                        checked={draft.examType === opt.id}
                        onChange={() =>
                          setDraft((d) => ({ ...d, examType: opt.id }))
                        }
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          )}

          {step === 1 && (
            <div className="onboarding-fields">
              <label className="field">
                <span className="field-label">Exam date</span>
                <input
                  type="date"
                  className="field-input field-date"
                  min={todayIsoDate()}
                  value={draft.examDate}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, examDate: e.target.value }))
                  }
                />
              </label>
              {draft.examDate && (
                <p className="date-hint">
                  {Math.ceil(
                    (new Date(draft.examDate).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24),
                  )}{' '}
                  days from today
                </p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="onboarding-fields">
              <fieldset className="field">
                <legend className="field-label">Study period</legend>
                <div className="option-group">
                  <label className="option-card">
                    <input
                      type="radio"
                      name="studyMode"
                      value="dedicated"
                      checked={draft.studyMode === 'dedicated'}
                      onChange={() =>
                        setDraft((d) => ({ ...d, studyMode: 'dedicated' }))
                      }
                    />
                    <span>
                      <strong>Dedicated period</strong>
                      <small>Full-time study before the exam</small>
                    </span>
                  </label>
                  <label className="option-card">
                    <input
                      type="radio"
                      name="studyMode"
                      value="alongside"
                      checked={draft.studyMode === 'alongside'}
                      onChange={() =>
                        setDraft((d) => ({ ...d, studyMode: 'alongside' }))
                      }
                    />
                    <span>
                      <strong>Alongside curriculum</strong>
                      <small>Balancing classes and Step prep</small>
                    </span>
                  </label>
                </div>
              </fieldset>

              <label className="field">
                <span className="field-label">
                  Hours per day you can study:{' '}
                  <strong className="hours-value">{draft.hoursPerDay}h</strong>
                </span>
                <input
                  type="range"
                  className="field-range"
                  min={1}
                  max={14}
                  step={0.5}
                  value={draft.hoursPerDay}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      hoursPerDay: parseFloat(e.target.value),
                    }))
                  }
                />
                <div className="range-labels">
                  <span>1h</span>
                  <span>14h</span>
                </div>
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="onboarding-fields">
              <p className="field-label">Select all that apply</p>
              <div className="resource-grid">
                {RESOURCE_OPTIONS.map((res) => (
                  <label key={res.id} className="resource-chip">
                    <input
                      type="checkbox"
                      checked={draft.resources.includes(res.id)}
                      onChange={() => toggleResource(res.id)}
                    />
                    <span>{res.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <footer className="onboarding-footer">
          {step > 0 ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setStep((s) => s - 1)}
            >
              Back
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canContinue}
            onClick={goNext}
          >
            {step === STEPS.length - 1 ? 'Start studying' : 'Continue'}
          </button>
        </footer>
      </div>
    </div>
  )
}
