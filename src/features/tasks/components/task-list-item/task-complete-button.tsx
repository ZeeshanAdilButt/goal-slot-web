import { Task } from '@/features/tasks/utils/types'
import { CheckCircle2 } from 'lucide-react'

interface TaskCompleteButtonProps {
  task: Task
  onComplete?: (task: Task) => void
}

export function TaskCompleteButton({ task, onComplete }: TaskCompleteButtonProps) {
  if (task.status === 'DONE') {
    return (
      <div className="flex items-center gap-2 rounded-md bg-accent-green/10 px-3 py-2 text-xs font-bold uppercase text-accent-green">
        <CheckCircle2 className="h-4 w-4" />
        Completed & Logged
      </div>
    )
  }

  return (
    <button
      onClick={() => onComplete?.(task)}
      className="btn-brutal-dark flex w-full items-center justify-center gap-2 px-3 py-1.5 text-[10px] sm:px-4 sm:py-2 sm:text-xs md:text-sm"
    >
      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
      <span className="whitespace-nowrap">Complete Task</span>
    </button>
  )
}
