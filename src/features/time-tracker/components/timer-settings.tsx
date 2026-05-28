import { useCategoriesQuery } from '@/features/categories'
import { Goal } from '@/features/time-tracker/utils/types'
import { useTimerStore } from '@/lib/use-timer-store'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Clock } from 'lucide-react'

interface TimerSettingsProps {
  goals: Goal[]
  currentCategory: string
  currentGoalId: string
  timerState: 'STOPPED' | 'RUNNING' | 'PAUSED'
  isTaskSelected?: boolean
  onCategoryChange: (category: string) => void
  onGoalIdChange: (goalId: string) => void
}

const LABEL_CLASS = 'block text-xs font-semibold uppercase tracking-wider text-zinc-500'
const SELECT_TRIGGER_CLASS =
  'h-auto w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-colors hover:border-zinc-300 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d] disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:border-[#f2cc0d]'

export function TimerSettings({
  goals,
  currentCategory,
  currentGoalId,
  timerState,
  isTaskSelected = false,
  onCategoryChange,
  onGoalIdChange,
}: TimerSettingsProps) {
  const { data: categories = [] } = useCategoriesQuery()
  const REMINDER_OPTIONS = [5, 10, 15, 20, 30, 45, 60]
  const { reminderInterval, setReminderInterval } = useTimerStore((state) => ({
    reminderInterval: state.reminderInterval || 15,
    setReminderInterval: state.setReminderInterval,
  }))

  const canClearAll = timerState === 'STOPPED' && (!!currentGoalId || !!currentCategory)

  return (
    <div className="mb-4 space-y-3 text-left">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <label className={`${LABEL_CLASS} mb-1`}>Reminder</label>
          <Select
            value={reminderInterval.toString()}
            onValueChange={(val) => setReminderInterval(Number(val))}
            disabled={timerState === 'RUNNING'}
          >
            <SelectTrigger className={`${SELECT_TRIGGER_CLASS} sm:w-56`}>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-zinc-500" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {REMINDER_OPTIONS.map((min) => (
                <SelectItem key={min} value={min.toString()}>
                  Every {min} minutes
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canClearAll && (
          <button
            type="button"
            onClick={() => {
              onGoalIdChange('')
              onCategoryChange('')
            }}
            className="inline-flex h-9 items-center gap-1.5 self-end rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900"
          >
            <X className="h-3.5 w-3.5" />
            Clear goal & category
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <label className={LABEL_CLASS}>
              Link to goal
              {isTaskSelected && currentGoalId && (
                <span className="ml-1 text-[10px] font-normal normal-case text-zinc-400">(from task)</span>
              )}
            </label>
          </div>
          <div className="relative">
            {currentGoalId && timerState === 'STOPPED' && (
              <button
                type="button"
                onClick={() => onGoalIdChange('')}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                aria-label="Clear goal"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <Select
              value={currentGoalId || 'no_goal'}
              onValueChange={(val) => onGoalIdChange(val === 'no_goal' ? '' : val)}
              disabled={timerState !== 'STOPPED'}
            >
              <SelectTrigger className={`${SELECT_TRIGGER_CLASS} pr-8`}>
                <SelectValue placeholder="Select goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_goal">No goal</SelectItem>
                {goals.map((goal) => (
                  <SelectItem key={goal.id} value={goal.id}>
                    {goal.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <label className={LABEL_CLASS}>
              Category
              {isTaskSelected && (
                <span className="ml-1 text-[10px] font-normal normal-case text-zinc-400">(from task)</span>
              )}
            </label>
          </div>
          <div className="relative">
            {currentCategory && timerState === 'STOPPED' && (
              <button
                type="button"
                onClick={() => onCategoryChange('')}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                aria-label="Clear category"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <Select
              value={currentCategory || 'no_category'}
              onValueChange={(val) => onCategoryChange(val === 'no_category' ? '' : val)}
              disabled={timerState !== 'STOPPED'}
            >
              <SelectTrigger className={`${SELECT_TRIGGER_CLASS} pr-8`}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_category">No category</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
