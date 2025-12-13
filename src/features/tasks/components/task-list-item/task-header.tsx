import { taskStatusStyles } from '@/features/tasks/utils/task-status-styles'
import { Task } from '@/features/tasks/utils/types'

import { cn } from '@/lib/utils'

interface TaskHeaderProps {
  task: Task
}

export function TaskHeader({ task }: TaskHeaderProps) {
  const statusStyle = taskStatusStyles[task.status]

  return (
    <div className="flex items-start gap-3">
      <span className={cn('mt-1 h-3 w-3 rounded-full border-2 border-secondary shadow-brutal-sm', statusStyle.dot)} />
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase text-gray-500">
          {task.category && (
            <span className="rounded-sm border border-secondary/40 bg-gray-50 px-1.5 py-0.5">
              {task.category.replace('_', ' ')}
            </span>
          )}
          {task.scheduleBlock ? (
            <span className="rounded-sm border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-blue-700">Scheduled</span>
          ) : (
            <span className="rounded-sm border border-dashed border-gray-300 bg-gray-50 px-1.5 py-0.5 text-gray-600">
              Unscheduled
            </span>
          )}
        </div>
        <h4 className={cn('font-display text-lg font-bold uppercase leading-tight', statusStyle.text)}>{task.title}</h4>
        {task.description && <p className="max-w-[62ch] text-sm text-gray-700">{task.description}</p>}
      </div>
    </div>
  )
}
