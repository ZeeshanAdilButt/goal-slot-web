import { Task } from '@/features/tasks/utils/types'
import { CheckCircle2, Circle } from 'lucide-react'

import { cn } from '@/lib/utils'

interface CompactTaskHeaderProps {
  task: Task
  isCompleted: boolean
  isInProgress: boolean
  goalColor?: string
}

export function CompactTaskHeader({ task, isCompleted, isInProgress, goalColor }: CompactTaskHeaderProps) {
  return (
    <>
      {/* Status Icon */}
      <div className="shrink-0">
        {isCompleted ? (
          <CheckCircle2 className="h-4 w-4 text-gray-400 sm:h-5 sm:w-5" />
        ) : (
          <Circle className={cn('h-4 w-4 sm:h-5 sm:w-5', isInProgress ? 'text-accent-blue' : 'text-gray-300')} />
        )}
      </div>

      {/* Goal Color Indicator */}
      {goalColor && (
        <div
          className="h-3 w-3 shrink-0 rounded-full border-2 border-secondary sm:h-4 sm:w-4"
          style={{ backgroundColor: goalColor }}
        />
      )}

      {/* Task Title */}
      <span className={cn('flex-1 truncate min-w-0', isCompleted && 'line-through')}>{task.title}</span>
    </>
  )
}
