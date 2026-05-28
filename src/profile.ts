export type ExamType = 'usmle-step1' | 'comlex-level1' | 'both'

export type StudyMode = 'dedicated' | 'alongside'

export type ResourceId =
  | 'uworld'
  | 'combank'
  | 'amboss'
  | 'anki'
  | 'sketchy'
  | 'pathoma'
  | 'first-aid'
  | 'goljan'

export type UserProfile = {
  name: string
  examType: ExamType
  examDate: string
  studyMode: StudyMode
  hoursPerDay: number
  resources: ResourceId[]
  onboardingComplete: boolean
}

const STORAGE_KEY = 'step1-planner-profile'

export const RESOURCE_OPTIONS: { id: ResourceId; label: string }[] = [
  { id: 'uworld', label: 'UWorld' },
  { id: 'combank', label: 'COMBANK' },
  { id: 'amboss', label: 'AMBOSS' },
  { id: 'anki', label: 'Anki' },
  { id: 'sketchy', label: 'Sketchy' },
  { id: 'pathoma', label: 'Pathoma' },
  { id: 'first-aid', label: 'First Aid' },
  { id: 'goljan', label: 'Goljan' },
]

export const EXAM_OPTIONS: { id: ExamType; label: string }[] = [
  { id: 'usmle-step1', label: 'USMLE Step 1' },
  { id: 'comlex-level1', label: 'COMLEX Level 1' },
  { id: 'both', label: 'Both' },
]

export function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as UserProfile
    if (!parsed.onboardingComplete) return null
    return parsed
  } catch {
    return null
  }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

export function getDaysUntilExam(examDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exam = new Date(examDate + 'T00:00:00')
  exam.setHours(0, 0, 0, 0)
  const diff = exam.getTime() - today.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function examTypeLabel(examType: ExamType): string {
  switch (examType) {
    case 'usmle-step1':
      return 'USMLE Step 1'
    case 'comlex-level1':
      return 'COMLEX Level 1'
    case 'both':
      return 'Step 1 & COMLEX'
  }
}

export function todayIsoDate(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
