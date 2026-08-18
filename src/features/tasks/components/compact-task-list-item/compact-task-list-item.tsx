import { type KeyboardEvent, useState } from 'react'

import { TaskActions } from '@/features/tasks/components/task-list-item/task-actions'
import { useDeleteTaskMutation, useRestoreTaskMutation } from '@/features/tasks/hooks/use-tasks-mutations'
import { Task } from '@/features/tasks/utils/types'
import { CheckCircle2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { ConfirmDialog } from '@/components/confirm-dialog'

import { CompactTaskHeader } from './compact-task-header'

interface CompactTaskListItemProps {
  task: Task
  isHovered: boolean
  onHover: (taskId: string | null) => void
  onEdit: (task: Task) => void
  onComplete?: (task: Task) => void
}

export function CompactTaskListItem({
  task,
  isHovered,
  onHover,
  onEdit,
  onComplete,
}: CompactTaskListItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const deleteTaskMutation = useDeleteTaskMutation()
  const restoreTaskMutation = useRestoreTaskMutation()

  const isCompleted = task.status === 'DONE'
  const isInProgress = task.status === 'DOING'
  const goalColor = task.goal?.color

  const handleDelete = async (): Promise<void> => {
    await deleteTaskMutation.mutateAsync(task.id)
    setShowDeleteConfirm(false)
  }

  const handleRestore = async (): Promise<void> => {
    await restoreTaskMutation.mutateAsync(task.id)
  }

  // Clicking the row opens the edit form directly rather than an inline
  // read-only expansion - the expansion showed nothing the edit form
  // doesn't already show, and having both meant a click on the row and a
  // click on the Edit button did two different things for no reason.
  const handleRowClick = () => onEdit(task)
  const handleRowKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // A keyboard Enter/Space on a nested action button (Delete, Complete,
    // Restore) still bubbles a keydown up to this handler even though the
    // button's own onClick already stopped propagation - stopPropagation on
    // click never stops a keydown from bubbling. Only react when the event
    // originated on the row itself, not a descendant.
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onEdit(task)
    }
  }

  return (
    <>
      <div
        className={cn(
          'relative w-full border border-zinc-200 bg-white',
          'transition-all duration-150',
          'hover:bg-primary hover:shadow-sm hover:-translate-x-0.25 hover:-translate-y-0.25',
          isCompleted && 'opacity-60',
        )}
        onMouseEnter={() => onHover(task.id)}
        onMouseLeave={() => onHover(null)}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={handleRowClick}
          onKeyDown={handleRowKeyDown}
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
              {onComplete && task.status !== 'DONE' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onComplete(task)
                  }}
                  className={cn(
                    'rounded-sm border-2 border-green-300 bg-white p-1.5 shadow-sm transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-sm',
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
                onDelete={() => setShowDeleteConfirm(true)}
                onRestore={handleRestore}
              />
            </div>

            {/* Status Badge - Far Right */}
            {!isCompleted && (
              <span
                className={cn(
                  'px-2 py-1 text-[10px] sm:text-xs font-bold uppercase border border-zinc-200 flex-shrink-0',
                  isInProgress ? 'bg-sky-50 text-white' : 'bg-white text-zinc-900',
                )}
              >
                {task.status.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>
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
