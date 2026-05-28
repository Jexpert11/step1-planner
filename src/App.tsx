import { useMemo, useState } from 'react'
import { Onboarding } from './Onboarding'
import {
  examTypeLabel,
  getDaysUntilExam,
  loadProfile,
  saveProfile,
  type UserProfile,
} from './profile'
import {
  generateTodayTasks,
  labelForType,
  priorityLabelForType,
  type Task,
} from './taskGenerator'
import './App.css'

type TabId = 'home' | 'plan' | 'topics' | 'scores'

const App = () => {
  const [profile, setProfile] = useState<UserProfile | null>(() => loadProfile())
  const [activeTab, setActiveTab] = useState<TabId>('home')
  const [tasks, setTasks] = useState<Task[]>(() => {
    const p = loadProfile()
    return p ? generateTodayTasks(p) : []
  })

  const handleOnboardingComplete = (newProfile: UserProfile) => {
    saveProfile(newProfile)
    setProfile(newProfile)
    setTasks(generateTodayTasks(newProfile))
  }

  if (!profile) {
    return (
      <div className="app-shell">
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    )
  }

  const daysUntilExam = getDaysUntilExam(profile.examDate)

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
            profile={profile}
            daysUntilExam={daysUntilExam}
            tasks={tasks}
            totalMinutes={totalMinutes}
            completedMinutes={completedMinutes}
            progressPct={progressPct}
            onToggleTask={toggleTask}
          />
        )}
        {activeTab === 'plan' && <PlanScreen profile={profile} />}
        {activeTab === 'topics' && <TopicsScreen />}
        {activeTab === 'scores' && <ScoresScreen />}
      </main>

      <TabBar activeTab={activeTab} onChange={setActiveTab} />
    </div>
  )
}

type HomeScreenProps = {
  profile: UserProfile
  daysUntilExam: number
  tasks: Task[]
  totalMinutes: number
  completedMinutes: number
  progressPct: number
  onToggleTask: (id: number) => void
}

const HomeScreen = ({
  profile,
  daysUntilExam,
  tasks,
  totalMinutes,
  completedMinutes,
  progressPct,
  onToggleTask,
}: HomeScreenProps) => {
  const remainingMinutes = totalMinutes - completedMinutes
  const studyLabel =
    profile.studyMode === 'dedicated' ? 'Dedicated study' : 'Alongside classes'

  return (
    <section className="screen-content">
      <header className="screen-header">
        <div>
          <p className="eyebrow">{examTypeLabel(profile.examType)}</p>
          <h1 className="title">Welcome back, {profile.name}</h1>
          <p className="muted header-meta">
            {studyLabel} · {profile.hoursPerDay}h/day target
          </p>
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
              {daysUntilExam > 90
                ? 'Build foundations — balance content with questions.'
                : daysUntilExam < 30
                  ? 'Exam crunch — prioritize questions and review.'
                  : 'Practice first, then tighten up weak spots.'}
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

const PlanScreen = ({ profile }: { profile: UserProfile }) => (
  <section className="screen-content placeholder">
    <h1 className="title">Study plan</h1>
    <p className="muted">
      {profile.hoursPerDay} hours/day until{' '}
      {new Date(profile.examDate + 'T00:00:00').toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })}
      . Weekly targets coming soon.
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

export default App
