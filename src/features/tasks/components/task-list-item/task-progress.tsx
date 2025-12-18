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

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-gray-700">
        <div className="flex items-center gap-1">
          <Hourglass className="h-3 w-3" />
          <span>{estimatedMinutes ? `Estimate ${formatDuration(estimatedMinutes)}` : 'No estimate set'}</span>
        </div>
        {trackedMinutes !== undefined ? (
          <span className="flex items-center gap-1 font-semibold text-secondary">
            <CheckCircle2 className="h-3 w-3" />
            Logged {formatDuration(trackedMinutes)}
          </span>
        ) : (
          <span className="text-gray-400">Not logged yet</span>
        )}
      </div>

      {estimatedMinutes ? (
        <div className="progress-brutal rounded-sm">
          <div className={cn('progress-brutal-fill', statusStyle.fill)} style={{ width: `${progress}%` }} />
        </div>
      ) : (
        <div className="text-[11px] font-bold uppercase text-gray-400">Add an estimate to track progress</div>
      )}
    </div>
  )
}
