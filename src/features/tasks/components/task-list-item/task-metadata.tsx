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
    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase">
      {task.scheduleBlock ? (
        <div className="flex items-center gap-1 rounded-sm border-2 border-blue-200 bg-blue-50 px-2 py-1 text-blue-800">
          <Clock className="h-3 w-3" />
          <span>
            {DAYS_OF_WEEK_FULL[task.scheduleBlock.dayOfWeek].slice(0, 3)} • {task.scheduleBlock.startTime} -{' '}
            {task.scheduleBlock.endTime}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-1 rounded-sm border-2 border-dashed border-gray-200 bg-gray-50 px-2 py-1 text-gray-500">
          <Clock className="h-3 w-3" />
          <span>No schedule yet</span>
        </div>
      )}

      {task.goal && (
        <div
          className="flex items-center gap-1 rounded-sm border-2 px-2 py-1 text-xs uppercase text-secondary"
          style={goalAccent}
        >
          <Target className="h-3 w-3" />
          <span>{task.goal.title}</span>
        </div>
      )}

      {task.dueDate && (
        <div className="flex items-center gap-1 rounded-sm border-2 border-amber-200 bg-amber-50 px-2 py-1 text-amber-800">
          <CalendarClock className="h-3 w-3" />
          <span>Due {formatDate(task.dueDate, 'MMM d')}</span>
        </div>
      )}
    </div>
  )
}
