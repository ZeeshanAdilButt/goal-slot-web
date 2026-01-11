import { useCategoriesQuery } from '@/features/categories'
import { Goal } from '@/features/time-tracker/utils/types'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X } from 'lucide-react'

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
  const { data: categories = [] } = useCategoriesQuery()
  const canClearAll = timerState === 'STOPPED' && (!!currentGoalId || !!currentCategory)

  return (
    <div className="mb-6">
      {canClearAll && (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => {
              onGoalIdChange('')
              onCategoryChange('')
            }}
            className="flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase text-white/80 transition hover:border-white/40 hover:bg-white/10 hover:text-white"
          >
            <X className="h-3.5 w-3.5" /> Clear Goal & Category
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <label className="block text-sm font-bold uppercase opacity-75">
              Link to Goal {isTaskSelected && currentGoalId && <span className="text-xs opacity-70">(From Task)</span>}
            </label>
          </div>
          <div className="relative">
            {currentGoalId && timerState === 'STOPPED' && (
              <button
                type="button"
                onClick={() => onGoalIdChange('')}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
                aria-label="Clear goal"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <Select
              value={currentGoalId || 'no_goal'}
              onValueChange={(val) => onGoalIdChange(val === 'no_goal' ? '' : val)}
              disabled={timerState !== 'STOPPED'}
            >
              <SelectTrigger className="h-auto w-full border-2 border-white/30 bg-white/10 px-4 py-2 pr-10 text-white shadow-none hover:border-white/50 hover:bg-white/20 hover:text-white hover:shadow-none focus:border-primary focus:ring-0 disabled:opacity-50 data-[state=open]:bg-white/20 data-[state=open]:text-white">
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
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <label className="block text-sm font-bold uppercase opacity-75">
              Category {isTaskSelected && <span className="text-xs opacity-70">(From Task)</span>}
            </label>
          </div>
          <div className="relative">
            {currentCategory && timerState === 'STOPPED' && (
              <button
                type="button"
                onClick={() => onCategoryChange('')}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
                aria-label="Clear category"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <Select
              value={currentCategory || 'no_category'}
              onValueChange={(val) => onCategoryChange(val === 'no_category' ? '' : val)}
              disabled={timerState !== 'STOPPED'}
            >
              <SelectTrigger className="h-auto w-full border-2 border-white/30 bg-white/10 px-4 py-2 pr-10 text-white shadow-none hover:border-white/50 hover:bg-white/20 hover:text-white hover:shadow-none focus:border-primary focus:ring-0 disabled:opacity-50 data-[state=open]:bg-white/20 data-[state=open]:text-white">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_category">No Category</SelectItem>
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
