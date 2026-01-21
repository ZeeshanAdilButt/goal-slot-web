import { useUpdateTaskMutation } from '@/features/tasks/hooks/use-tasks-mutations'
import { Task } from '@/features/tasks/utils/types'
import { Edit, Play, RotateCcw, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useStartTimerWithConfirmation } from '@/features/time-tracker/hooks/use-start-timer-with-confirmation'
import { TimerSwitchDialog } from '@/features/time-tracker/components/timer-switch-dialog'

interface TaskActionsProps {
  task: Task
  isHovered: boolean
  onEdit?: (task: Task) => void
  onDelete: () => void
  onRestore: () => void
}

export function TaskActions({ task, isHovered, onEdit, onDelete, onRestore }: TaskActionsProps) {
  const updateTaskMutation = useUpdateTaskMutation()
  const {
    startTimer,
    showConfirmDialog,
    setShowConfirmDialog,
    currentTask,
    elapsedTime,
    handleSaveAndSwitch,
    handleDiscardAndContinue,
    isLoading,
  } = useStartTimerWithConfirmation()

  const handleStartTimer = (): void => {
    startTimer({
      task: task.title,
      taskId: task.id,
      category: task.category || 'DEEP_WORK',
      goalId: task.goalId || '',
      taskTitle: task.title,
      onStartTimer: () => {
        // Update task status to DOING if it's in BACKLOG or TODO
        if (task.status === 'BACKLOG' || task.status === 'TODO') {
          updateTaskMutation.mutate({
            taskId: task.id,
            data: { status: 'DOING' },
          })
        }
      },
    })
  }

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-1 transition-opacity duration-150',
          'opacity-100 sm:opacity-0',
          isHovered && 'sm:opacity-100',
        )}
      >
        {task.status !== 'DONE' && (
          <button
            onClick={handleStartTimer}
            className="rounded-sm border-2 border-primary bg-white p-1.5 shadow-brutal-sm transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal"
            title="Start time tracking"
          >
            <Play className="h-3.5 w-3.5 text-primary" />
          </button>
        )}
        {task.status === 'DONE' && (
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

      <TimerSwitchDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        currentTask={currentTask}
        elapsedTime={elapsedTime}
        onSaveAndSwitch={handleSaveAndSwitch}
        onDiscardAndContinue={handleDiscardAndContinue}
        isLoading={isLoading}
      />
    </>
  )
}
