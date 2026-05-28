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

const QUESTION_BLOCK_MINUTES = 60
const WEEKS_UNTIL_CRUNCH = 8
const CRUNCH_DAYS = WEEKS_UNTIL_CRUNCH * 7

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

type TimeSplit = Record<TaskType, number>

function timeSplit(daysUntil: number): TimeSplit {
  const withinEightWeeks = daysUntil <= CRUNCH_DAYS
  return {
    questions: withinEightWeeks ? 0.5 : 0.4,
    review: 0.3,
    anki: 0.2,
    reading: withinEightWeeks ? 0.05 : 0.1,
  }
}

function pickQuestionBank(
  resources: ResourceId[],
  examType: UserProfile['examType'],
): ResourceId | null {
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
  if (reading.length === 0) return 'Reading'
  if (reading.length === 1) return RESOURCE_LABELS[reading[0]]
  if (reading.length === 2) {
    return `${RESOURCE_LABELS[reading[0]]} & ${RESOURCE_LABELS[reading[1]]}`
  }
  return `${RESOURCE_LABELS[reading[0]]} + ${reading.length - 1} more`
}

function minutesForType(
  type: TaskType,
  totalMinutes: number,
  split: TimeSplit,
): number {
  return Math.round(totalMinutes * split[type])
}

export function generateTodayTasks(profile: UserProfile): Task[] {
  const daysUntil = getDaysUntilExam(profile.examDate)
  const totalMinutes = Math.round(profile.hoursPerDay * 60)
  const split = timeSplit(daysUntil)
  const { resources } = profile

  const hasQBank = QUESTION_BANKS.some((r) => resources.includes(r))
  const hasAnki = resources.includes('anki')
  const hasReading = READING_RESOURCES.some((r) => resources.includes(r))

  if (!hasQBank && !hasAnki && !hasReading) {
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

  const candidates: Omit<Task, 'id' | 'completed'>[] = []

  if (hasQBank) {
    const bank = pickQuestionBank(resources, profile.examType)!
    candidates.push({
      type: 'questions',
      label: `${RESOURCE_LABELS[bank]} block (40 qs · ${QUESTION_BLOCK_MINUTES} min)`,
      minutes: minutesForType('questions', totalMinutes, split),
    })
    candidates.push({
      type: 'review',
      label: 'Review answers',
      minutes: minutesForType('review', totalMinutes, split),
    })
  }

  if (hasAnki) {
    candidates.push({
      type: 'anki',
      label: 'Anki review (spaced repetition)',
      minutes: minutesForType('anki', totalMinutes, split),
    })
  }

  if (hasReading) {
    candidates.push({
      type: 'reading',
      label: `${readingLabel(resources)} study`,
      minutes: minutesForType('reading', totalMinutes, split),
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
      return 'Review answers'
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
