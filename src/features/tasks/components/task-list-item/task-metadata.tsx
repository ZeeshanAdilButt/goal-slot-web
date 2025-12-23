import { Task } from '@/features/tasks/utils/types'
import { CalendarClock, Clock, Target } from 'lucide-react'

import { DAYS_OF_WEEK_FULL, formatDate } from '@/lib/utils'

interface TaskMetadataProps {
  task: Task
}

export function TaskMetadata({ task }: TaskMetadataProps) {
  const goalAccent =
    task.goal?.color && task.goal.color.startsWith('#')
      ? { borderColor: task.goal.color, backgroundColor: `${task.goal.color}18` }
      : undefined

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold uppercase sm:gap-2 sm:text-[11px]">
      {task.category && (
        <div className="rounded-sm border border-secondary/20 bg-secondary/5 px-1.5 py-0.5 text-secondary/70 sm:px-2 sm:py-1">
          {task.category.replace('_', ' ')}
        </div>
      )}

      {task.scheduleBlock && (
        <div className="flex items-center gap-1 rounded-sm border-2 border-blue-200 bg-blue-50 px-1.5 py-0.5 text-blue-800 sm:px-2 sm:py-1">
          <Clock className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3" />
          <span className="whitespace-nowrap">
            {DAYS_OF_WEEK_FULL[task.scheduleBlock.dayOfWeek].slice(0, 3)} • {task.scheduleBlock.startTime} -{' '}
            {task.scheduleBlock.endTime}
          </span>
        </div>
      )}

      {task.goal && (
        <div
          className="flex min-w-0 items-center gap-1 rounded-sm border-2 px-1.5 py-0.5 text-[10px] uppercase text-secondary sm:px-2 sm:py-1 sm:text-xs"
          style={goalAccent}
        >
          <Target className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3" />
          <span className="truncate">{task.goal.title}</span>
        </div>
      )}

      {task.dueDate && (
        <div className="flex items-center gap-1 whitespace-nowrap rounded-sm border-2 border-amber-200 bg-amber-50 px-1.5 py-0.5 text-amber-800 sm:px-2 sm:py-1">
          <CalendarClock className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3" />
          <span>Due {formatDate(task.dueDate, 'MMM d')}</span>
        </div>
      )}
    </div>
  )
}
