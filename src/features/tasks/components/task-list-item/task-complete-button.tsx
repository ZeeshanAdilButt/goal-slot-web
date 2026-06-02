import { Task } from '@/features/tasks/utils/types'
import { CheckCircle2 } from 'lucide-react'

interface TaskCompleteButtonProps {
  task: Task
  onComplete?: (task: Task) => void
}

export function TaskCompleteButton({ task, onComplete }: TaskCompleteButtonProps) {
  if (task.status === 'DONE') {
    return (
      <div className="text-accent-green flex items-center gap-2 rounded-md bg-emerald-50/10 px-3 py-2 text-xs font-bold uppercase">
        <CheckCircle2 className="h-4 w-4" />
        Completed & Logged
      </div>
    )
  }

  return (
    <button
      onClick={() => onComplete?.(task)}
      className="flex inline-flex w-full items-center justify-center gap-2 rounded-lg bg-rose-500 px-3 px-4 py-1.5 py-2 text-[10px] text-sm font-semibold text-white transition-colors hover:bg-rose-600 sm:px-4 sm:py-2 sm:text-xs md:text-sm"
    >
      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
      <span className="whitespace-nowrap">Complete Task</span>
    </button>
  )
}
