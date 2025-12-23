import { taskStatusStyles } from '@/features/tasks/utils/task-status-styles'
import { Task } from '@/features/tasks/utils/types'

import { cn } from '@/lib/utils'

interface TaskStatusBadgeProps {
  task: Task
}

export function TaskStatusBadge({ task }: TaskStatusBadgeProps) {
  const statusStyle = taskStatusStyles[task.status]

  return (
    <span
      className={cn(
        'badge-brutal rounded-sm px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] tracking-widest flex-shrink-0',
        statusStyle.badge,
      )}
    >
      {task.status.replace('_', ' ')}
    </span>
  )
}
