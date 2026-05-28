import { Eye, EyeOff } from 'lucide-react'

import { cn } from '@/lib/utils'

interface TasksFiltersProps {
  showCompleted: boolean
  onShowCompletedChange: (show: boolean) => void
}

export function TasksFilters({ showCompleted, onShowCompletedChange }: TasksFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      <button
        type="button"
        onClick={() => onShowCompletedChange(!showCompleted)}
        aria-pressed={!showCompleted}
        className={cn(
          'inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors',
          showCompleted
            ? 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300'
            : 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800',
        )}
      >
        {showCompleted ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        {showCompleted ? 'Hide completed' : 'Show completed'}
      </button>
    </div>
  )
}
