'use client'

import { useRef, useState, type CSSProperties } from 'react'

import { useCategoriesQuery } from '@/features/categories'
import { useDeleteScheduleBlock } from '@/features/schedule/hooks/use-schedule-mutations'
import { scheduleQueries } from '@/features/schedule/utils/queries'
import { ScheduleBlock } from '@/features/schedule/utils/types'
import { useDraggable } from '@dnd-kit/core'
import { useIsMutating } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Pencil, Target, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { Loading } from '@/components/ui/loading'
import { ConfirmDialog } from '@/components/confirm-dialog'

import { BlockTasksList } from './block-tasks-list'

type DraggableBlockProps = {
  block: ScheduleBlock
  top: number
  height: number
  isActiveDrag?: boolean
  onEdit: () => void
  onViewDetail: () => void
}

export function DraggableBlock({ block, top, height, isActiveDrag, onEdit, onViewDetail }: DraggableBlockProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const { mutateAsync: deleteBlock } = useDeleteScheduleBlock()
  const { data: categories = [] } = useCategoriesQuery()
  const draggableId = block.id
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: draggableId,
    data: { type: 'block', block },
  })
  const isUpdating =
    useIsMutating({
      mutationKey: scheduleQueries.mutation.update(),
      predicate: (mutation) => (mutation.state.variables as { id?: string })?.id === block.id,
    }) > 0

  // If the block has a linked goal with a category, use the goal's category for color
  const effectiveCategory = block.goal?.category || block.category
  const categoryColor = categories.find((cat) => cat.value === effectiveCategory)?.color

  const handleDeleteClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    setDeleteDialogOpen(true)
  }

  const handleEditClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    onEdit()
  }

  const handleBlockClick = (event: React.MouseEvent) => {
    if (deleteDialogOpen) return
    onViewDetail()
  }

  const confirmDelete = async () => {
    try {
      await deleteBlock(block.id)
      toast.success('Block deleted')
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const blockStyle: CSSProperties = {
    backgroundColor: categoryColor || block.color || '#9CA3AF',
    top,
    height,
    minHeight: height,
    zIndex: 10,
    transform: !isActiveDrag && transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isActiveDrag ? 0 : isDragging ? 0.7 : 1,
    visibility: isActiveDrag ? 'hidden' : 'visible',
    pointerEvents: isActiveDrag ? 'none' : 'auto',
    willChange: 'transform',
  }

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isActiveDrag ? 0 : 1, scale: isActiveDrag ? 1 : 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
      className="group absolute left-1 right-1 cursor-grab overflow-hidden border-2 border-secondary p-2 shadow-brutal-sm"
      data-block
      style={blockStyle}
      onClick={handleBlockClick}
      {...attributes}
      {...listeners}
    >
      <div className="flex h-full min-h-0 flex-col overflow-clip">
        <div ref={headerRef} className="flex shrink-0 flex-col">
          <div className="flex items-start justify-between">
            <div className="truncate pr-12 text-xs font-bold uppercase">{block.title}</div>
            <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={handleEditClick}
                onPointerDown={(event) => event.stopPropagation()}
                className="flex h-5 w-5 items-center justify-center border border-secondary bg-white hover:bg-gray-100"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                onClick={handleDeleteClick}
                onPointerDown={(event) => event.stopPropagation()}
                className="flex h-5 w-5 items-center justify-center border border-secondary bg-white hover:bg-red-50"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>

          {block.goal && (
            <div className="mt-0.5 flex shrink-0 items-center gap-0.5 text-[9px] font-semibold uppercase leading-tight">
              <Target className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{block.goal.title}</span>
            </div>
          )}
        </div>

        <BlockTasksList tasks={block.tasks} blockHeight={height} headerRef={headerRef} />
      </div>

      {isUpdating && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full border-2 border-secondary bg-white/80 p-1 shadow-brutal-sm">
            <Loading size="sm" className="h-3 w-3" />
          </div>
        </div>
      )}

      <ResizeHandle position="top" block={block} />
      <ResizeHandle position="bottom" block={block} />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Schedule Block"
        description="Are you sure you want to delete this schedule block? This action cannot be undone."
        onConfirm={confirmDelete}
        confirmButtonText="Delete"
        variant="destructive"
      />
    </motion.div>
  )
}

type ResizeHandleProps = {
  position: 'top' | 'bottom'
  block: ScheduleBlock
}

function ResizeHandle({ position, block }: ResizeHandleProps) {
  const handleId = `${block.id}-${position}`
  const type = position === 'top' ? 'resize-start' : 'resize-end'
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: handleId,
    data: { type, block },
  })

  return (
    <div
      ref={setNodeRef}
      className={`absolute left-1 right-1 h-2 cursor-ns-resize border border-secondary bg-white/70 ${
        position === 'top' ? '-top-1' : '-bottom-1'
      } ${isDragging ? 'opacity-80' : 'opacity-0 group-hover:opacity-80'}`}
      {...listeners}
      {...attributes}
      onClick={(event) => event.stopPropagation()}
    />
  )
}
