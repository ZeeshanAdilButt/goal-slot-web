'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'

import { useReorderTasksMutation, useUpdateTaskMutation } from '@/features/tasks/hooks/use-tasks-mutations'
import { taskStatusStyles } from '@/features/tasks/utils/task-status-styles'
import { Task, TaskStatus } from '@/features/tasks/utils/types'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, GripVertical, PencilLine, Play } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TaskHeader } from '@/features/tasks/components/task-list-item/task-header'
import { TaskMetadata } from '@/features/tasks/components/task-list-item/task-metadata'
import { TaskProgress } from '@/features/tasks/components/task-list-item/task-progress'

const BOARD_COLUMNS: Array<{ id: TaskStatus; title: string; helper: string; accent: string; text: string }> = [
  { id: 'BACKLOG', title: 'Backlog', helper: 'Capture ideas', accent: 'bg-gray-50', text: 'text-gray-700' },
  { id: 'TODO', title: 'To Do', helper: 'Ready to start next', accent: 'bg-amber-50', text: 'text-secondary' },
  { id: 'DOING', title: 'Doing', helper: 'In motion right now', accent: 'bg-blue-50', text: 'text-blue-700' },
  { id: 'DONE', title: 'Done', helper: 'Shipped and finished', accent: 'bg-green-50', text: 'text-green-700' },
]

interface TaskBoardProps {
  tasks: Task[]
  onEdit?: (task: Task) => void
  onComplete?: (task: Task) => void
}

export function TaskBoard({ tasks, onEdit, onComplete }: TaskBoardProps) {
  const updateTaskMutation = useUpdateTaskMutation()
  const reorderTasksMutation = useReorderTasksMutation()

  // Track drag operations to prevent sync during drag
  const isDraggingRef = useRef(false)

  // Group tasks by status locally to handle drag and drop optimistic updates properly
  const [columns, setColumns] = useState<Record<TaskStatus, Task[]>>({
    BACKLOG: [],
    TODO: [],
    DOING: [],
    DONE: [],
  })

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [detailTask, setDetailTask] = useState<Task | null>(null)

  // Sync props to local state whenever tasks change (but not during drag)
  useEffect(() => {
    // Don't overwrite optimistic updates during drag
    if (isDraggingRef.current) return

    const next: Record<TaskStatus, Task[]> = {
      BACKLOG: [],
      TODO: [],
      DOING: [],
      DONE: [],
    }

    const sorted = [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0))
    sorted.forEach((task) => {
      next[task.status]?.push(task)
    })

    setColumns(next)
  }, [tasks])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const handleDragStart = (event: DragStartEvent) => {
    isDraggingRef.current = true
    setActiveTaskId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    const activeId = String(active.id)
    const overId = over ? String(over.id) : null

    setActiveTaskId(null)
    // Reset drag flag after a small delay to ensure state is applied first
    setTimeout(() => {
      isDraggingRef.current = false
    }, 100)

    if (!overId || !over) return

    const activeType = active.data.current?.type as string | undefined
    const overType = over.data.current?.type as string | undefined
    const activeColumn = active.data.current?.columnId as TaskStatus | undefined
    const overColumnFromTask = over.data.current?.columnId as TaskStatus | undefined

    const sourceColumn = activeColumn
    // If dropped on a column droppable, use that. Otherwise use the task's column.
    // Also handle case where overId matches a column name directly.
    let targetColumn: TaskStatus | undefined = overType === 'column' ? (over.id as TaskStatus) : overColumnFromTask

    // Fallback: check if overId is a column ID
    if (!targetColumn && BOARD_COLUMNS.some((c) => c.id === overId)) {
      targetColumn = overId as TaskStatus
    }

    if (!sourceColumn || !targetColumn) return

    // Build working copy
    const next = { ...columns }

    // Get source items
    const sourceItems = [...next[sourceColumn]]
    const movingIndex = sourceItems.findIndex((t) => t.id === activeId)
    if (movingIndex === -1) return
    const movingTask = sourceItems[movingIndex]

    if (sourceColumn === targetColumn) {
      // Reorder within same column - use arrayMove on original array
      const overIndex = sourceItems.findIndex((t) => t.id === overId)
      if (overIndex === -1 || movingIndex === overIndex) return

      const reordered = arrayMove(sourceItems, movingIndex, overIndex)
      next[sourceColumn] = reordered
      setColumns(next)
      reorderTasksMutation.mutate(reordered.map((t) => t.id))
      return
    }

    // Move across columns - remove from source first
    sourceItems.splice(movingIndex, 1)
    next[sourceColumn] = sourceItems

    const destItems = [...next[targetColumn]]
    const overIndex = destItems.findIndex((t) => t.id === overId)
    const insertAt = overIndex >= 0 ? overIndex : destItems.length
    const updatedTask = { ...movingTask, status: targetColumn }
    destItems.splice(insertAt, 0, updatedTask)
    next[targetColumn] = destItems
    setColumns(next)

    updateTaskMutation.mutate({ taskId: activeId, data: { status: targetColumn } })
    reorderTasksMutation.mutate(destItems.map((t) => t.id))

    if (targetColumn === 'DONE' && onComplete) {
      onComplete(updatedTask)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="scrollbar-hide flex h-full w-full snap-x snap-mandatory gap-1.5 overflow-x-auto px-4 pb-6">
        {BOARD_COLUMNS.map((colDef) => (
          <BoardColumn key={colDef.id} column={{ ...colDef, tasks: columns[colDef.id] }}>
            {columns[colDef.id].map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                columnId={colDef.id}
                onEdit={onEdit}
                onComplete={onComplete}
                onView={setDetailTask}
              />
            ))}
          </BoardColumn>
        ))}
      </div>

      <DragOverlay>
        {activeTaskId ? (
          // Find the task in columns to render overlay
          <TaskCard
            task={
              Object.values(columns)
                .flat()
                .find((t) => t.id === activeTaskId) as Task
            }
            dragging
          />
        ) : null}
      </DragOverlay>
      <TaskDetailDialog task={detailTask} onClose={() => setDetailTask(null)} />
    </DndContext>
  )
}

interface BoardColumnProps {
  column: {
    id: TaskStatus
    title: string
    helper: string
    accent: string
    text: string
    tasks: Task[]
  }
  children: ReactNode
}

function BoardColumn({ column, children }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { type: 'column' } })
  const taskIds = useMemo(() => column.tasks.map((t) => t.id), [column.tasks])

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-[260px] min-w-[280px] snap-center flex-col gap-3 p-0 sm:min-w-[320px] md:min-w-[350px]',
        column.accent,
        isOver ? 'ring-2 ring-secondary' : 'ring-0',
      )}
    >
      <div className="flex items-start justify-between gap-3 px-2 py-3">
        <div>
          <p className="font-display text-sm font-bold uppercase text-secondary sm:text-base">{column.title}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary/70 sm:text-xs">
            {column.helper}
          </p>
        </div>
        <span className="badge-brutal text-[11px] sm:text-xs">{column.tasks.length}</span>
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2">
          {column.tasks.length ? (
            children
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-md border-2 border-dashed border-secondary/30 px-2 py-6 text-center text-[11px] font-semibold uppercase tracking-wide text-secondary/60 sm:text-xs">
              Drop tasks here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
  onComplete?: (task: Task) => void
  onView?: (task: Task) => void
  listeners?: any
  attributes?: any
  setNodeRef?: (element: HTMLElement | null) => void
  style?: CSSProperties
  dragging?: boolean
}

function TaskCard({
  task,
  onEdit,
  onComplete,
  onView,
  listeners,
  attributes,
  setNodeRef,
  style,
  dragging = false,
}: TaskCardProps) {
  const statusStyle = taskStatusStyles[task.status]

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => {
        if (!dragging) onView?.(task)
      }}
      className={cn(
        'group relative flex cursor-pointer flex-col gap-2 rounded-md border border-secondary/20 bg-white p-2 transition-all sm:p-2.5',
        dragging ? '' : 'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-secondary/40',
      )}
    >
      <div aria-hidden className={cn('pointer-events-none absolute inset-0 opacity-70', statusStyle.glow)} />

      <div className="relative flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <h3
            className="flex-1 font-display text-sm font-bold uppercase leading-tight text-secondary transition-colors hover:text-primary hover:underline sm:text-base"
          >
            {task.title}
          </h3>
          {task.estimatedMinutes ? (
            <span className="badge-brutal hidden text-[10px] sm:inline-flex sm:text-xs">
              {parseFloat((task.estimatedMinutes / 60).toFixed(2))}h
            </span>
          ) : null}
        </div>
        {task.description ? (
          <div
            className="hidden text-[11px] leading-relaxed text-secondary/80 sm:line-clamp-2 sm:block sm:text-xs"
            dangerouslySetInnerHTML={{ __html: task.description || '' }}
          />
        ) : null}
        <div className="hidden flex-wrap items-center gap-2 sm:flex">
          {task.goal?.title ? (
            <span className="rounded-sm border-2 border-secondary bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-secondary">
              {task.goal.title}
            </span>
          ) : null}
          {task.dueDate ? (
            <span className="rounded-sm border border-dashed border-secondary/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary/80">
              Due {new Date(task.dueDate).toLocaleDateString()}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1 rounded-sm border-2 border-secondary/30 bg-secondary/20 p-1 shadow-brutal-sm transition sm:absolute sm:right-0 sm:top-0 sm:pointer-events-none sm:opacity-0 sm:group-hover:pointer-events-auto sm:group-hover:opacity-100 sm:group-focus-within:pointer-events-auto sm:group-focus-within:opacity-100">
          <button
            {...listeners}
            {...attributes}
            onClick={(event) => event.stopPropagation()}
            className="inline-flex cursor-grab rounded-sm border-2 border-secondary bg-white p-1 transition sm:hover:-translate-x-0.5 sm:hover:-translate-y-0.5"
            aria-label="Drag task"
          >
            <GripVertical className="h-3.5 w-3.5 text-secondary" />
          </button>
          <button
            onClick={(event) => event.stopPropagation()}
            className="rounded-sm border-2 border-secondary bg-white p-1.5 transition sm:hover:-translate-x-0.5 sm:hover:-translate-y-0.5"
            aria-label="Start timer"
          >
            <Play className="h-4 w-4 fill-secondary text-secondary" />
          </button>
          {onComplete && task.status !== 'DONE' && (
            <button
              onClick={(event) => {
                event.stopPropagation()
                onComplete(task)
              }}
              className="rounded-sm border-2 border-green-600 bg-green-100 p-1.5 transition sm:hover:-translate-x-0.5 sm:hover:-translate-y-0.5 sm:hover:bg-green-200"
              aria-label="Complete task"
            >
              <Check className="h-4 w-4 text-green-700" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={(event) => {
                event.stopPropagation()
                onEdit(task)
              }}
              className="rounded-sm border-2 border-secondary bg-white p-1.5 transition sm:hover:-translate-x-0.5 sm:hover:-translate-y-0.5"
              aria-label="Edit task"
            >
              <PencilLine className="h-4 w-4 text-secondary" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

interface DraggableTaskCardProps {
  task: Task
  columnId: TaskStatus
  onEdit?: (task: Task) => void
  onComplete?: (task: Task) => void
  onView?: (task: Task) => void
}

function SortableTaskCard({ task, columnId, onEdit, onComplete, onView }: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', columnId },
  })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TaskCard
      task={task}
      onEdit={onEdit}
      onComplete={onComplete}
      onView={onView}
      listeners={listeners}
      attributes={attributes}
      setNodeRef={setNodeRef}
      style={style}
      dragging={isDragging}
    />
  )
}

interface TaskDetailDialogProps {
  task: Task | null
  onClose: () => void
}

function TaskDetailDialog({ task, onClose }: TaskDetailDialogProps) {
  if (!task) return null

  return (
    <Dialog open={!!task} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="modal-brutal w-[90vw] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold uppercase text-secondary sm:text-2xl">Task Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-display text-base font-bold uppercase leading-tight text-secondary sm:text-lg">
              {task.title}
            </h4>
            {task.description ? (
              <div
                className="max-w-full break-words text-xs text-gray-700 sm:text-sm"
                dangerouslySetInnerHTML={{ __html: task.description }}
              />
            ) : null}
          </div>
          <TaskMetadata task={task} />
          <TaskProgress task={task} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
