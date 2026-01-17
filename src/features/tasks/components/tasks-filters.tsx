import { cn } from '@/lib/utils'

interface TasksFiltersProps {
  showCompleted: boolean
  onShowCompletedChange: (show: boolean) => void
}

export function TasksFilters({ showCompleted, onShowCompletedChange }: TasksFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-secondary/70">
      <button
        onClick={() => onShowCompletedChange(!showCompleted)}
        className={cn(
          'h-8 rounded-sm border-2 px-3 shadow-brutal-sm transition',
          showCompleted ? 'border-secondary bg-secondary text-white' : 'border-secondary bg-white text-secondary',
        )}
      >
        {showCompleted ? 'Hide completed' : 'Show completed'}
      </button>
    </div>
  )
}
