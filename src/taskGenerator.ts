import type { ResourceId, UserProfile } from './profile'
import { getDaysUntilExam } from './profile'

export type TaskType = 'questions' | 'review' | 'anki' | 'reading'

export type Task = {
  id: number
  label: string
  type: TaskType
  minutes: number
  completed: boolean
}

const TASK_ORDER: TaskType[] = ['questions', 'review', 'anki', 'reading']

const QUESTION_BANKS: ResourceId[] = ['uworld', 'combank', 'amboss']
const READING_RESOURCES: ResourceId[] = [
  'pathoma',
  'first-aid',
  'goljan',
  'sketchy',
]

const RESOURCE_LABELS: Record<ResourceId, string> = {
  uworld: 'UWorld',
  combank: 'COMBANK',
  amboss: 'AMBOSS',
  anki: 'Anki',
  sketchy: 'Sketchy',
  pathoma: 'Pathoma',
  'first-aid': 'First Aid',
  goljan: 'Goljan',
}

type PhaseWeights = Record<TaskType, number>

function phaseWeights(daysUntil: number): PhaseWeights {
  if (daysUntil > 90) {
    return { questions: 0.32, review: 0.18, anki: 0.22, reading: 0.28 }
  }
  if (daysUntil < 30) {
    return { questions: 0.48, review: 0.28, anki: 0.14, reading: 0.1 }
  }
  return { questions: 0.4, review: 0.24, anki: 0.2, reading: 0.16 }
}

function pickQuestionBank(resources: ResourceId[], examType: UserProfile['examType']): ResourceId | null {
  const banks = QUESTION_BANKS.filter((r) => resources.includes(r))
  if (banks.length === 0) return null

  if (examType === 'comlex-level1') {
    return banks.find((b) => b === 'combank') ?? banks[0]
  }
  if (examType === 'usmle-step1') {
    return banks.find((b) => b === 'uworld') ?? banks[0]
  }
  return banks.find((b) => b === 'uworld') ?? banks[0]
}

function readingLabel(resources: ResourceId[]): string {
  const reading = READING_RESOURCES.filter((r) => resources.includes(r))
  if (reading.length === 0) return 'Content review'
  if (reading.length === 1) return RESOURCE_LABELS[reading[0]]
  if (reading.length === 2) {
    return `${RESOURCE_LABELS[reading[0]]} & ${RESOURCE_LABELS[reading[1]]}`
  }
  return `${RESOURCE_LABELS[reading[0]]} + ${reading.length - 1} more`
}

function questionBlockSize(daysUntil: number, hoursPerDay: number): { qs: number; label: string } {
  if (daysUntil < 30) {
    return { qs: 40, label: '40 qs' }
  }
  if (hoursPerDay >= 8) {
    return { qs: 40, label: '40 qs' }
  }
  if (hoursPerDay >= 5) {
    return { qs: 30, label: '30 qs' }
  }
  return { qs: 20, label: '20 qs' }
}

export function generateTodayTasks(profile: UserProfile): Task[] {
  const daysUntil = getDaysUntilExam(profile.examDate)
  const totalMinutes = Math.round(profile.hoursPerDay * 60)
  const weights = phaseWeights(daysUntil)
  const { resources } = profile

  const hasQBank = QUESTION_BANKS.some((r) => resources.includes(r))
  const hasAnki = resources.includes('anki')
  const hasReading = READING_RESOURCES.some((r) => resources.includes(r))

  const activeTypes: TaskType[] = []
  if (hasQBank) {
    activeTypes.push('questions', 'review')
  }
  if (hasAnki) activeTypes.push('anki')
  if (hasReading) activeTypes.push('reading')

  if (activeTypes.length === 0) {
    return [
      {
        id: 1,
        label: 'Set up your study resources',
        type: 'reading',
        minutes: Math.min(totalMinutes, 30),
        completed: false,
      },
    ]
  }

  const weightSum = activeTypes.reduce((sum, t) => sum + weights[t], 0)
  const rawMinutes = Object.fromEntries(
    activeTypes.map((t) => [
      t,
      Math.round((weights[t] / weightSum) * totalMinutes),
    ]),
  ) as Record<TaskType, number>

  let allocated = activeTypes.reduce((sum, t) => sum + rawMinutes[t], 0)
  const remainder = totalMinutes - allocated
  if (remainder !== 0 && activeTypes.length > 0) {
    rawMinutes[activeTypes[0]] += remainder
    allocated += remainder
  }

  const candidates: Omit<Task, 'id' | 'completed'>[] = []

  if (hasQBank) {
    const bank = pickQuestionBank(resources, profile.examType)!
    const block = questionBlockSize(daysUntil, profile.hoursPerDay)
    candidates.push({
      type: 'questions',
      label: `${RESOURCE_LABELS[bank]} blocks (${block.label})`,
      minutes: Math.max(25, rawMinutes.questions),
    })
    candidates.push({
      type: 'review',
      label: 'Review missed questions',
      minutes: Math.max(15, rawMinutes.review),
    })
  }

  if (hasAnki) {
    candidates.push({
      type: 'anki',
      label: 'Anki review (spaced repetition)',
      minutes: Math.max(15, rawMinutes.anki),
    })
  }

  if (hasReading) {
    candidates.push({
      type: 'reading',
      label: `${readingLabel(resources)} study`,
      minutes: Math.max(15, rawMinutes.reading),
    })
  }

  return candidates
    .sort((a, b) => TASK_ORDER.indexOf(a.type) - TASK_ORDER.indexOf(b.type))
    .map((task, index) => ({
      id: index + 1,
      completed: false,
      ...task,
    }))
}

export function labelForType(type: TaskType): string {
  switch (type) {
    case 'questions':
      return 'Practice questions'
    case 'review':
      return 'Review wrong answers'
    case 'anki':
      return 'Anki'
    case 'reading':
      return 'Reading'
  }
}

export function priorityLabelForType(type: TaskType): string {
  switch (type) {
    case 'questions':
    case 'review':
      return 'High'
    case 'anki':
      return 'Medium'
    case 'reading':
      return 'Low'
  }
}
