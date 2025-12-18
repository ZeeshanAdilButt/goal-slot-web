import { Task } from '@/features/tasks/utils/types'
import { CheckCircle2 } from 'lucide-react'

interface TaskCompleteButtonProps {
  task: Task
  onComplete?: (task: Task) => void
}

export function TaskCompleteButton({ task, onComplete }: TaskCompleteButtonProps) {
  if (task.status === 'COMPLETED') {
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
      className="btn-brutal-dark flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm"
    >
      <CheckCircle2 className="h-4 w-4" />
      Complete Task
    </button>
  )
}
