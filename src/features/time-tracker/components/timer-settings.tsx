import { TASK_CATEGORIES } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { Goal } from '../utils/types'

interface TimerSettingsProps {
  goals: Goal[]
  currentCategory: string
  currentGoalId: string
  timerState: 'STOPPED' | 'RUNNING' | 'PAUSED'
  isTaskSelected?: boolean
  onCategoryChange: (category: string) => void
  onGoalIdChange: (goalId: string) => void
}

export function TimerSettings({
  goals,
  currentCategory,
  currentGoalId,
  timerState,
  isTaskSelected = false,
  onCategoryChange,
  onGoalIdChange,
}: TimerSettingsProps) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-4">
      <div>
        <label className="mb-2 block text-sm font-bold uppercase opacity-75">
          Category {isTaskSelected && <span className="text-xs opacity-70">(From Task)</span>}
        </label>
        <Select
          value={currentCategory}
          onValueChange={onCategoryChange}
          disabled={timerState !== 'STOPPED' || isTaskSelected}
        >
          <SelectTrigger className="h-auto w-full border-2 border-white/30 bg-white/10 px-4 py-2 text-white shadow-none hover:border-white/50 hover:bg-white/20 hover:text-white hover:shadow-none focus:border-primary focus:ring-0 disabled:opacity-50 data-[state=open]:bg-white/20 data-[state=open]:text-white">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {TASK_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-bold uppercase opacity-75">
          Link to Goal {isTaskSelected && currentGoalId && <span className="text-xs opacity-70">(From Task)</span>}
        </label>
        <Select
          value={currentGoalId || 'no_goal'}
          onValueChange={(val) => onGoalIdChange(val === 'no_goal' ? '' : val)}
          disabled={timerState !== 'STOPPED' || isTaskSelected}
        >
          <SelectTrigger className="h-auto w-full border-2 border-white/30 bg-white/10 px-4 py-2 text-white shadow-none hover:border-white/50 hover:bg-white/20 hover:text-white hover:shadow-none focus:border-primary focus:ring-0 disabled:opacity-50 data-[state=open]:bg-white/20 data-[state=open]:text-white">
            <SelectValue placeholder="Select goal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no_goal">No Goal</SelectItem>
            {goals.map((goal) => (
              <SelectItem key={goal.id} value={goal.id}>
                {goal.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
