'use client'

import { useState, type CSSProperties } from 'react'

import { ScheduleBlock } from '@/features/schedule/utils/types'
import { useDraggable } from '@dnd-kit/core'
import { useIsMutating } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Loader2, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { getCategoryColor } from '@/lib/utils'
import { ConfirmDialog } from '@/components/confirm-dialog'

import { useDeleteScheduleBlock } from '../../hooks/use-schedule-mutations'
import { scheduleQueries } from '../../utils/queries'

type DraggableBlockProps = {
  block: ScheduleBlock
  top: number
  height: number
  isActiveDrag?: boolean
  onEdit: () => void
}

export function DraggableBlock({ block, top, height, isActiveDrag, onEdit }: DraggableBlockProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const { mutateAsync: deleteBlock } = useDeleteScheduleBlock()
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

  const handleDeleteClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    setDeleteDialogOpen(true)
  }

  const handleBlockClick = (event: React.MouseEvent) => {
    if (deleteDialogOpen) return
    onEdit()
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
    backgroundColor: block.color || getCategoryColor(block.category),
    top,
    height,
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
      className="group absolute left-1 right-1 z-10 cursor-grab border-2 border-secondary p-2 shadow-brutal-sm"
      data-block
      style={blockStyle}
      onClick={handleBlockClick}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between">
        <div className="truncate pr-6 text-xs font-bold uppercase">{block.title}</div>
        <button
          onClick={handleDeleteClick}
          onPointerDown={(event) => event.stopPropagation()}
          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center border border-secondary bg-white opacity-0 transition-opacity group-hover:opacity-100"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      <div className="font-mono text-[11px]">
        {block.startTime} - {block.endTime}
      </div>
      {block.goal && <div className="mt-1 truncate font-mono text-[11px]">→ {block.goal.title}</div>}

      {isUpdating && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full border-2 border-secondary bg-white/80 p-1 shadow-brutal-sm">
            <Loader2 className="h-3 w-3 animate-spin text-secondary" />
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
