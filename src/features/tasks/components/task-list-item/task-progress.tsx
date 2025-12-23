import { taskStatusStyles } from '@/features/tasks/utils/task-status-styles'
import { Task } from '@/features/tasks/utils/types'
import { CheckCircle2, Hourglass } from 'lucide-react'

import { cn, formatDuration } from '@/lib/utils'

interface TaskProgressProps {
  task: Task
}

export function TaskProgress({ task }: TaskProgressProps) {
  const trackedMinutes = task.trackedMinutes ?? task.actualMinutes
  const estimatedMinutes = task.estimatedMinutes
  const progress = estimatedMinutes ? Math.min(100, Math.round(((trackedMinutes || 0) / estimatedMinutes) * 100)) : 0
  const statusStyle = taskStatusStyles[task.status]

  if (!estimatedMinutes && !trackedMinutes) return null

  return (
    <div className="space-y-1.5 sm:space-y-2">
      <div className="flex flex-col gap-1.5 font-mono text-[10px] text-gray-700 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:text-[11px]">
        <div className="flex items-center gap-1">
          <Hourglass className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3" />
          <span className="break-words">
            {estimatedMinutes ? `Estimate ${formatDuration(estimatedMinutes)}` : 'No estimate'}
          </span>
        </div>
        {trackedMinutes !== undefined && trackedMinutes > 0 && (
          <span className="flex items-center gap-1 whitespace-nowrap font-semibold text-secondary">
            <CheckCircle2 className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3" />
            Logged {formatDuration(trackedMinutes)}
          </span>
        )}
      </div>

      {estimatedMinutes ? (
        <div className="progress-brutal rounded-sm">
          <div className={cn('progress-brutal-fill', statusStyle.fill)} style={{ width: `${progress}%` }} />
        </div>
      ) : null}
    </div>
  )
}
