import { useMemo, useState } from 'react'
import './App.css'

type TabId = 'home' | 'plan' | 'topics' | 'scores'

type TaskType = 'questions' | 'review' | 'anki' | 'reading'

type Task = {
  id: number
  label: string
  type: TaskType
  minutes: number
  completed: boolean
}

const USER_NAME = 'Alex'
const DAYS_UNTIL_EXAM = 42

const TASK_ORDER: TaskType[] = ['questions', 'review', 'anki', 'reading']

function createTodayTasks(): Task[] {
  const base: Omit<Task, 'id' | 'completed'>[] = [
    { label: 'UWORLD blocks (40 qs)', type: 'questions', minutes: 75 },
    { label: 'Review missed questions', type: 'review', minutes: 45 },
    { label: 'Anki review (Spaced Repetition)', type: 'anki', minutes: 30 },
    { label: 'Pathoma / FA reading', type: 'reading', minutes: 40 },
  ]

  return base
    .sort(
      (a, b) => TASK_ORDER.indexOf(a.type) - TASK_ORDER.indexOf(b.type),
    )
    .map((task, index) => ({
      id: index + 1,
      completed: false,
      ...task,
    }))
}

const App = () => {
  const [activeTab, setActiveTab] = useState<TabId>('home')
  const [tasks, setTasks] = useState<Task[]>(() => createTodayTasks())

  const totalMinutes = useMemo(
    () => tasks.reduce((acc, t) => acc + t.minutes, 0),
    [tasks],
  )

  const completedMinutes = useMemo(
    () =>
      tasks
        .filter((t) => t.completed)
        .reduce((acc, t) => acc + t.minutes, 0),
    [tasks],
  )

  const progressPct = totalMinutes
    ? Math.round((completedMinutes / totalMinutes) * 100)
    : 0

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    )
  }

  return (
    <div className="app-shell">
      <main className="screen">
        {activeTab === 'home' && (
          <HomeScreen
            userName={USER_NAME}
            daysUntilExam={DAYS_UNTIL_EXAM}
            tasks={tasks}
            totalMinutes={totalMinutes}
            completedMinutes={completedMinutes}
            progressPct={progressPct}
            onToggleTask={toggleTask}
          />
        )}
        {activeTab === 'plan' && <PlanScreen />}
        {activeTab === 'topics' && <TopicsScreen />}
        {activeTab === 'scores' && <ScoresScreen />}
      </main>

      <TabBar activeTab={activeTab} onChange={setActiveTab} />
    </div>
  )
}

type HomeScreenProps = {
  userName: string
  daysUntilExam: number
  tasks: Task[]
  totalMinutes: number
  completedMinutes: number
  progressPct: number
  onToggleTask: (id: number) => void
}

const HomeScreen = ({
  userName,
  daysUntilExam,
  tasks,
  totalMinutes,
  completedMinutes,
  progressPct,
  onToggleTask,
}: HomeScreenProps) => {
  const remainingMinutes = totalMinutes - completedMinutes

  return (
    <section className="screen-content">
      <header className="screen-header">
        <div>
          <p className="eyebrow">Step 1 Planner</p>
          <h1 className="title">Welcome back, {userName}</h1>
        </div>
        <div className="pill days-pill">
          <span className="days-number">{daysUntilExam}</span>
          <span className="days-label">days until exam</span>
        </div>
      </header>

      <section className="card progress-card">
        <div className="card-header">
          <div>
            <h2>Today&apos;s focus</h2>
            <p className="muted">
              Practice first, then tighten up weak spots.
            </p>
          </div>
          <span className="tag">{progressPct}%</span>
        </div>
        <div className="progress-track" aria-hidden="true">
          <div
            className="progress-fill"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="progress-meta">
          <span>
            {Math.round(completedMinutes)} min done ·{' '}
            {Math.max(remainingMinutes, 0)} min left
          </span>
        </div>
      </section>

      <section className="card tasks-card">
        <div className="card-header">
          <h2>Today&apos;s plan</h2>
          <p className="muted">Prioritized in the order you should study.</p>
        </div>

        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.id} className="task-row">
              <button
                type="button"
                className={`check-button ${task.completed ? 'checked' : ''}`}
                onClick={() => onToggleTask(task.id)}
                aria-pressed={task.completed}
              >
                <span className="check-icon" />
              </button>
              <div className="task-main">
                <p className="task-label">{task.label}</p>
                <p className="task-meta">
                  {task.minutes} min · {labelForType(task.type)}
                </p>
              </div>
              <span className="task-priority">
                {priorityLabelForType(task.type)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}

const PlanScreen = () => (
  <section className="screen-content placeholder">
    <h1 className="title">Study plan</h1>
    <p className="muted">
      Map out your weeks leading up to test day. You&apos;ll be able to set
      daily question and Anki targets here.
    </p>
  </section>
)

const TopicsScreen = () => (
  <section className="screen-content placeholder">
    <h1 className="title">Topics</h1>
    <p className="muted">
      Track systems and high-yield topics you&apos;ve covered and what&apos;s
      still left.
    </p>
  </section>
)

const ScoresScreen = () => (
  <section className="screen-content placeholder">
    <h1 className="title">Scores</h1>
    <p className="muted">
      Watch practice exam trajectories and NBME form scores over time.
    </p>
  </section>
)

type TabBarProps = {
  activeTab: TabId
  onChange: (tab: TabId) => void
}

const TabBar = ({ activeTab, onChange }: TabBarProps) => {
  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'plan', label: 'Plan', icon: 'calendar' },
    { id: 'topics', label: 'Topics', icon: 'list' },
    { id: 'scores', label: 'Scores', icon: 'chart' },
  ]

  return (
    <nav className="tab-bar" aria-label="Primary navigation">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className={`tab-icon tab-icon-${tab.icon}`} />
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}

function labelForType(type: TaskType): string {
  switch (type) {
    case 'questions':
      return 'Practice questions'
    case 'review':
      return 'Review wrong answers'
    case 'anki':
      return 'Anki'
    case 'reading':
      return 'Reading'
    default:
      return ''
  }
}

function priorityLabelForType(type: TaskType): string {
  switch (type) {
    case 'questions':
      return 'High'
    case 'review':
      return 'High'
    case 'anki':
      return 'Medium'
    case 'reading':
      return 'Low'
    default:
      return ''
  }
}

export default App
