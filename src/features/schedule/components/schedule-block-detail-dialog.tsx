'use client'

import { useState } from 'react'

import { useCategoriesQuery } from '@/features/categories'
import { ScheduleBlock } from '@/features/schedule/utils/types'
import { Pencil, Trash2 } from 'lucide-react'

import { DAYS_OF_WEEK_FULL, formatTime12h } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'

type ScheduleBlockDetailDialogProps = {
  isOpen: boolean
  onClose: () => void
  block: ScheduleBlock | null
  onEdit: () => void
  onDelete?: () => void
}

export function ScheduleBlockDetailDialog({
  isOpen,
  onClose,
  block,
  onEdit,
  onDelete,
}: ScheduleBlockDetailDialogProps) {
  const { data: categories = [] } = useCategoriesQuery()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!block) return null

  const effectiveCategory = block.goal?.category || block.category
  const category = categories.find((cat) => cat.value === effectiveCategory)
  const dayName = DAYS_OF_WEEK_FULL[block.dayOfWeek]

  const handleEdit = () => {
    onClose()
    onEdit()
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete()
      setShowDeleteConfirm(false)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader className="mb-4">
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-xl font-semibold text-zinc-900">{block.title}</DialogTitle>
            <div className="flex gap-2 pr-12 sm:pr-14">
              <Button variant="secondary" size="icon" className="h-8 w-8" onClick={handleEdit} title="Edit block">
                <Pencil className="h-4 w-4" />
              </Button>
              {onDelete && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 text-rose-600 hover:border-rose-200 hover:bg-rose-50"
                  onClick={handleDeleteClick}
                  title="Delete block"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Color indicator */}
          <div
            className="h-1.5 w-full rounded-full"
            style={{ backgroundColor: category?.color || block.color || '#9CA3AF' }}
          />

          {/* Day and Time */}
          <div className="space-y-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Day</div>
            <div className="text-sm font-semibold text-zinc-900">{dayName}</div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Time</div>
            <div className="text-sm font-semibold text-zinc-900">
              {formatTime12h(block.startTime)} – {formatTime12h(block.endTime)}
            </div>
          </div>

          {/* Category */}
          {category && (
            <div className="space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Category</div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm border border-zinc-200" style={{ backgroundColor: category.color }} />
                <span className="text-sm font-semibold text-zinc-900">{category.name}</span>
              </div>
            </div>
          )}

          {/* Goal */}
          {block.goal && (
            <div className="space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Linked Goal</div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm border border-zinc-200" style={{ backgroundColor: block.goal.color }} />
                <span className="text-sm font-semibold text-zinc-900">{block.goal.title}</span>
              </div>
            </div>
          )}

          {/* Tasks */}
          {block.tasks && block.tasks.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Tasks ({block.tasks.length})</div>
              <div className="space-y-1">
                {block.tasks.map((task) => (
                  <div key={task.id} className="text-sm text-zinc-700">
                    • {task.title}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {onDelete && (
        <ConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="Delete Schedule Block"
          description="Are you sure you want to delete this schedule block? This action cannot be undone."
          onConfirm={handleConfirmDelete}
          confirmButtonText="Delete"
          variant="destructive"
        />
      )}
    </Dialog>
  )
}
