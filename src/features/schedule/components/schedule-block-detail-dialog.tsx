'use client'

import { ScheduleBlock } from '@/features/schedule/utils/types'
import { Pencil } from 'lucide-react'

import { DAYS_OF_WEEK_FULL, getCategoryColor, SCHEDULE_CATEGORIES } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type ScheduleBlockDetailDialogProps = {
  isOpen: boolean
  onClose: () => void
  block: ScheduleBlock | null
  onEdit: () => void
}

export function ScheduleBlockDetailDialog({ isOpen, onClose, block, onEdit }: ScheduleBlockDetailDialogProps) {
  if (!block) return null

  const category = SCHEDULE_CATEGORIES.find((cat) => cat.value === block.category)
  const dayName = DAYS_OF_WEEK_FULL[block.dayOfWeek]

  const handleEdit = () => {
    onClose()
    onEdit()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="modal-brutal max-w-md">
        <DialogHeader className="mb-4">
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-2xl font-bold uppercase">{block.title}</DialogTitle>
            <button
              onClick={handleEdit}
              className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-secondary bg-white transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-sm"
              title="Edit block"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Color indicator */}
          <div
            className="h-4 w-full border-2 border-secondary"
            style={{ backgroundColor: block.color || getCategoryColor(block.category) }}
          />

          {/* Day and Time */}
          <div className="space-y-2">
            <div className="font-mono text-sm uppercase text-gray-600">Day</div>
            <div className="font-bold uppercase">{dayName}</div>
          </div>

          <div className="space-y-2">
            <div className="font-mono text-sm uppercase text-gray-600">Time</div>
            <div className="font-bold uppercase">
              {block.startTime} - {block.endTime}
            </div>
          </div>

          {/* Category */}
          {category && (
            <div className="space-y-2">
              <div className="font-mono text-sm uppercase text-gray-600">Category</div>
              <div className="flex items-center gap-2">
                <div className={`h-4 w-4 border-2 border-secondary ${category.color}`} />
                <span className="font-bold uppercase">{category.label}</span>
              </div>
            </div>
          )}

          {/* Goal */}
          {block.goal && (
            <div className="space-y-2">
              <div className="font-mono text-sm uppercase text-gray-600">Linked Goal</div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-secondary" style={{ backgroundColor: block.goal.color }} />
                <span className="font-bold uppercase">{block.goal.title}</span>
              </div>
            </div>
          )}

          {/* Tasks */}
          {block.tasks && block.tasks.length > 0 && (
            <div className="space-y-2">
              <div className="font-mono text-sm uppercase text-gray-600">Tasks ({block.tasks.length})</div>
              <div className="space-y-1">
                {block.tasks.map((task) => (
                  <div key={task.id} className="font-mono text-sm">
                    • {task.title}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
