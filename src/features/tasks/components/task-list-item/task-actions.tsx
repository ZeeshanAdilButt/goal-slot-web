import { Task } from '@/features/tasks/utils/types'
import { Edit, Play, RotateCcw, Trash2 } from 'lucide-react'

import { useTimerStore } from '@/lib/use-timer-store'
import { cn } from '@/lib/utils'

interface TaskActionsProps {
  task: Task
  isHovered: boolean
  onEdit?: (task: Task) => void
  onDelete: () => void
  onRestore: () => void
}

export function TaskActions({ task, isHovered, onEdit, onDelete, onRestore }: TaskActionsProps) {
  const { setTaskId, setTask, setCategory, setGoalId, start } = useTimerStore()

  const handleStartTimer = (): void => {
    setTaskId(task.id)
    setTask(task.title)
    setCategory(task.category || 'DEEP_WORK')
    setGoalId(task.goalId || '')
    start(task.title, task.category || 'DEEP_WORK', task.goalId || '')
  }

  return (
    <div
      className={cn('flex items-center gap-1 transition-opacity duration-150', isHovered ? 'opacity-100' : 'opacity-0')}
    >
      {task.status !== 'COMPLETED' && (
        <button
          onClick={handleStartTimer}
          className="rounded-sm border-2 border-primary bg-white p-1.5 shadow-brutal-sm transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal"
          title="Start time tracking"
        >
          <Play className="h-3.5 w-3.5 text-primary" />
        </button>
      )}
      {task.status === 'COMPLETED' && (
        <button
          onClick={onRestore}
          className="rounded-sm border-2 border-green-300 bg-white p-1.5 shadow-brutal-sm transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal"
          title="Restore task"
        >
          <RotateCcw className="h-3.5 w-3.5 text-green-600" />
        </button>
      )}
      {onEdit && (
        <button
          onClick={() => onEdit(task)}
          className="rounded-sm border-2 border-secondary bg-white p-1.5 shadow-brutal-sm transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal"
          title="Edit task"
        >
          <Edit className="h-3.5 w-3.5 text-gray-700" />
        </button>
      )}
      <button
        onClick={onDelete}
        className="rounded-sm border-2 border-red-300 bg-white p-1.5 shadow-brutal-sm transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal"
        title="Delete task"
      >
        <Trash2 className="h-3.5 w-3.5 text-red-600" />
      </button>
    </div>
  )
}
