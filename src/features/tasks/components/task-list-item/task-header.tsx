import { taskStatusStyles } from '@/features/tasks/utils/task-status-styles'
import { Task } from '@/features/tasks/utils/types'

import { cn } from '@/lib/utils'
import { HtmlContent } from '@/components/html-content'

interface TaskHeaderProps {
  task: Task
}

export function TaskHeader({ task }: TaskHeaderProps) {
  const statusStyle = taskStatusStyles[task.status]

  return (
    <div className="flex items-start gap-2 sm:gap-3">
      <span
        className={cn(
          'mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-secondary shadow-brutal-sm sm:h-3 sm:w-3',
          statusStyle.dot,
        )}
      />
      <div className="min-w-0 flex-1 space-y-1">
        <h4
          className={cn(
            'font-display text-base font-bold uppercase leading-tight break-words sm:text-lg',
            'text-secondary',
          )}
        >
          {task.title}
        </h4>
        {task.description && (
          <HtmlContent
            html={task.description}
            truncate={2}
            className="max-w-full break-words text-xs text-gray-700 sm:max-w-[62ch] sm:text-sm"
          />
        )}
      </div>
    </div>
  )
}
