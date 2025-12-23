import { useState } from 'react'

import { TaskActions } from '@/features/tasks/components/task-list-item/task-actions'
import { TaskCompleteButton } from '@/features/tasks/components/task-list-item/task-complete-button'
import { TaskHeader } from '@/features/tasks/components/task-list-item/task-header'
import { TaskMetadata } from '@/features/tasks/components/task-list-item/task-metadata'
import { TaskProgress } from '@/features/tasks/components/task-list-item/task-progress'
import { TaskStatusBadge } from '@/features/tasks/components/task-list-item/task-status-badge'
import {
  useDeleteTaskMutation,
  useRestoreTaskMutation,
  useUpdateTaskMutation,
} from '@/features/tasks/hooks/use-tasks-mutations'
import { taskStatusStyles } from '@/features/tasks/utils/task-status-styles'
import { Task } from '@/features/tasks/utils/types'

import { cn } from '@/lib/utils'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface TaskListItemProps {
  task: Task
  onComplete?: (task: Task) => void
  onEdit?: (task: Task) => void
}

export function TaskListItem({ task, onComplete, onEdit }: TaskListItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const deleteTaskMutation = useDeleteTaskMutation()
  const updateTaskMutation = useUpdateTaskMutation()
  const restoreTaskMutation = useRestoreTaskMutation()

  const handleDelete = async (): Promise<void> => {
    await deleteTaskMutation.mutateAsync(task.id)
  }

  const handleRestore = async (): Promise<void> => {
    await restoreTaskMutation.mutateAsync(task.id)
  }

  const statusStyle = taskStatusStyles[task.status]

  return (
    <div
      className={cn(
        'card-brutal relative h-full overflow-hidden p-3 transition-all duration-150 sm:p-4 md:p-5',
        'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal',
        task.status === 'COMPLETED' ? 'opacity-90' : '',
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        aria-hidden
        className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80', statusStyle.glow)}
      />

      <div className="relative flex h-full flex-col gap-2 sm:gap-3">
        <div className="flex-1 space-y-2 sm:space-y-3">
          {/* Mobile: Full-width title, then actions below */}
          {/* Desktop: Title on left, actions on right */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <div className="min-w-0 flex-1">
              <TaskHeader task={task} />
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <TaskActions
                task={task}
                isHovered={isHovered}
                onEdit={onEdit}
                onDelete={() => setShowDeleteConfirm(true)}
                onRestore={handleRestore}
              />
            </div>
          </div>

          <TaskMetadata task={task} />
        </div>

        <div className="mt-auto flex flex-col gap-3 border-t border-dashed border-secondary/20 pt-2 sm:grid sm:grid-cols-[1fr_auto] sm:items-center sm:pt-3">
          <TaskProgress task={task} />
          <div className="w-full sm:w-auto">
            <TaskCompleteButton task={task} onComplete={onComplete} />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Task"
        description={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        variant="destructive"
        isLoading={deleteTaskMutation.isPending}
      />
    </div>
  )
}
