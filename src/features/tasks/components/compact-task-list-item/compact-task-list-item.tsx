import { useState } from 'react'

import { TaskActions } from '@/features/tasks/components/task-list-item/task-actions'
import { useDeleteTaskMutation, useRestoreTaskMutation } from '@/features/tasks/hooks/use-tasks-mutations'
import { Task } from '@/features/tasks/utils/types'
import { CheckCircle2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import AnimateChangeInHeight from '@/components/animate-change-in-height'
import { ConfirmDialog } from '@/components/confirm-dialog'

import { CompactTaskExpanded } from './compact-task-expanded'
import { CompactTaskHeader } from './compact-task-header'

interface CompactTaskListItemProps {
  task: Task
  isExpanded: boolean
  isHovered: boolean
  onExpand: (taskId: string | null) => void
  onHover: (taskId: string | null) => void
  onEdit: (task: Task) => void
  onComplete?: (task: Task) => void
}

export function CompactTaskListItem({
  task,
  isExpanded,
  isHovered,
  onExpand,
  onHover,
  onEdit,
  onComplete,
}: CompactTaskListItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const deleteTaskMutation = useDeleteTaskMutation()
  const restoreTaskMutation = useRestoreTaskMutation()

  const isCompleted = task.status === 'COMPLETED'
  const isInProgress = task.status === 'IN_PROGRESS'
  const goalColor = task.goal?.color

  const handleDelete = async (): Promise<void> => {
    await deleteTaskMutation.mutateAsync(task.id)
    setShowDeleteConfirm(false)
    if (isExpanded) {
      onExpand(null)
    }
  }

  const handleRestore = async (): Promise<void> => {
    await restoreTaskMutation.mutateAsync(task.id)
  }

  return (
    <>
      <div
        className={cn(
          'relative w-full border-3 border-secondary bg-white',
          'transition-all duration-150',
          !isExpanded && 'hover:bg-primary hover:shadow-brutal-sm hover:-translate-x-0.25 hover:-translate-y-0.25',
          isCompleted && 'opacity-60',
          isExpanded && 'shadow-brutal',
        )}
        onMouseEnter={() => onHover(task.id)}
        onMouseLeave={() => onHover(null)}
      >
        {/* Collapsed View */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onExpand(isExpanded ? null : task.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onExpand(isExpanded ? null : task.id)
            }
          }}
          className={cn(
            'w-full flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-left cursor-pointer',
            'font-bold uppercase text-xs sm:text-sm',
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <CompactTaskHeader
              task={task}
              isCompleted={isCompleted}
              isInProgress={isInProgress}
              goalColor={goalColor}
            />
          </div>

          {/* Right Side: Action Buttons + Status Badge */}
          <div
            className="flex flex-shrink-0 items-center justify-between gap-2 sm:ml-auto sm:justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Action Buttons - Always visible on mobile, show on hover on desktop */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {onComplete && task.status !== 'COMPLETED' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onComplete(task)
                  }}
                  className={cn(
                    'rounded-sm border-2 border-green-300 bg-white p-1.5 shadow-brutal-sm transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal',
                    'transition-opacity duration-150',
                    'opacity-100 sm:opacity-0',
                    isHovered && 'sm:opacity-100',
                  )}
                  title="Complete task"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                </button>
              )}
              <TaskActions
                task={task}
                isHovered={isHovered}
                onEdit={onEdit}
                onDelete={() => setShowDeleteConfirm(true)}
                onRestore={handleRestore}
              />
            </div>

            {/* Status Badge - Far Right */}
            {!isCompleted && (
              <span
                className={cn(
                  'px-2 py-1 text-[10px] sm:text-xs font-bold uppercase border-2 border-secondary flex-shrink-0',
                  isInProgress ? 'bg-accent-blue text-white' : 'bg-white text-secondary',
                )}
              >
                {task.status.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>

        {/* Expanded View */}
        <AnimateChangeInHeight>{isExpanded && <CompactTaskExpanded task={task} />}</AnimateChangeInHeight>
      </div>

      {/* Delete Confirmation Dialog */}
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
    </>
  )
}
