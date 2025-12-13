import { TASK_CATEGORIES } from '@/lib/utils'
import { Goal } from '../utils/types'

interface TimerSettingsProps {
  goals: Goal[]
  currentCategory: string
  currentGoalId: string
  timerState: 'STOPPED' | 'RUNNING' | 'PAUSED'
  onCategoryChange: (category: string) => void
  onGoalIdChange: (goalId: string) => void
}

export function TimerSettings({
  goals,
  currentCategory,
  currentGoalId,
  timerState,
  onCategoryChange,
  onGoalIdChange,
}: TimerSettingsProps) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-4">
      <div>
        <label className="mb-2 block text-sm font-bold uppercase opacity-75">Category</label>
        <select
          value={currentCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          disabled={timerState !== 'STOPPED'}
          className="w-full border-2 border-white/30 bg-white/10 px-4 py-2 text-white focus:border-primary focus:outline-none disabled:opacity-50"
        >
          {TASK_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value} className="text-secondary">
              {cat.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-bold uppercase opacity-75">Link to Goal</label>
        <select
          value={currentGoalId}
          onChange={(e) => onGoalIdChange(e.target.value)}
          disabled={timerState !== 'STOPPED'}
          className="w-full border-2 border-white/30 bg-white/10 px-4 py-2 text-white focus:border-primary focus:outline-none disabled:opacity-50"
        >
          <option value="" className="text-secondary">
            No Goal
          </option>
          {goals.map((goal) => (
            <option key={goal.id} value={goal.id} className="text-secondary">
              {goal.title}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
