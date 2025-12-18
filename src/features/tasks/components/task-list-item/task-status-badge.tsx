import { taskStatusStyles } from '@/features/tasks/utils/task-status-styles'
import { Task } from '@/features/tasks/utils/types'

import { cn } from '@/lib/utils'

interface TaskStatusBadgeProps {
  task: Task
}

export function TaskStatusBadge({ task }: TaskStatusBadgeProps) {
  const statusStyle = taskStatusStyles[task.status]

  return (
    <span className={cn('badge-brutal rounded-sm px-2.5 py-1 text-[10px] tracking-widest', statusStyle.badge)}>
      {task.status.replace('_', ' ')}
    </span>
  )
}
