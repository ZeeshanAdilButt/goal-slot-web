'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'

import { TaskMetadata } from '@/features/tasks/components/task-list-item/task-metadata'
import { TaskProgress } from '@/features/tasks/components/task-list-item/task-progress'
import {
  useDeleteTaskMutation,
  useReorderTasksMutation,
  useUpdateTaskMutation,
} from '@/features/tasks/hooks/use-tasks-mutations'
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
import { Calendar, Check, GripVertical, PencilLine, Play, Trash2 } from 'lucide-react'

import { useTimerStore } from '@/lib/use-timer-store'
import { cn, formatDate } from '@/lib/utils'
import { useStartTimerWithConfirmation } from '@/features/time-tracker/hooks/use-start-timer-with-confirmation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { HtmlContent } from '@/components/html-content'
import { TimerSwitchDialog } from '@/features/time-tracker/components/timer-switch-dialog'
import VirtualizedList from '@/components/virtualized-list'

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
  const deleteTaskMutation = useDeleteTaskMutation()

  const handleDelete = async (task: Task): Promise<void> => {
    await deleteTaskMutation.mutateAsync(task.id)
  }

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
    <div className="flex min-h-0 flex-1 flex-col">
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="scrollbar-hide flex min-h-0 w-full flex-1 snap-x snap-mandatory gap-1 overflow-x-auto px-2">
          {BOARD_COLUMNS.map((colDef) => (
            <BoardColumn
              key={colDef.id}
              column={{ ...colDef, tasks: columns[colDef.id] }}
              renderTask={(task) => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  columnId={colDef.id}
                  onEdit={onEdit}
                  onComplete={onComplete}
                  onView={setDetailTask}
                  onDelete={handleDelete}
                />
              )}
            />
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
    </div>
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
  renderTask: (task: Task) => ReactNode
}

function BoardColumn({ column, renderTask }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { type: 'column' } })
  const taskIds = useMemo(() => column.tasks.map((t) => t.id), [column.tasks])

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-[260px] min-w-[280px] snap-center flex-col gap-3 p-0 sm:min-w-[320px] md:min-w-[350px] h-full',
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
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          {column.tasks.length ? (
            <VirtualizedList
              items={column.tasks}
              getItemKey={(task) => task.id}
              estimateSize={140}
              className="min-h-0 flex-1 overflow-auto"
              height="100%"
              renderItem={({ item }) => <div className="pb-2">{renderTask(item)}</div>}
            />
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
  onDelete?: (task: Task) => void
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
  onDelete,
  listeners,
  attributes,
  setNodeRef,
  style,
  dragging = false,
}: TaskCardProps) {
  const statusStyle = taskStatusStyles[task.status]
  const updateTaskMutation = useUpdateTaskMutation()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const deleteTaskMutation = useDeleteTaskMutation()
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

  const handleDelete = async (): Promise<void> => {
    if (onDelete) {
      await onDelete(task)
    } else {
      await deleteTaskMutation.mutateAsync(task.id)
    }
  }

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
          <h3 className="flex-1 font-display text-sm font-bold uppercase leading-tight text-secondary transition-colors hover:text-primary hover:underline sm:text-base">
            {task.title}
          </h3>
          {task.estimatedMinutes ? (
            <span className="badge-brutal hidden text-[10px] sm:inline-flex sm:text-xs">
              {parseFloat((task.estimatedMinutes / 60).toFixed(2))}h
            </span>
          ) : null}
        </div>
        {task.description ? (
          <HtmlContent
            html={task.description}
            truncate={2}
            className="hidden text-[11px] leading-relaxed text-secondary/80 sm:block sm:text-xs"
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
        <div className="flex items-center gap-0.5 rounded-sm border-2 border-secondary/30 bg-secondary/20 p-0.5 shadow-brutal-sm transition sm:pointer-events-none sm:absolute sm:right-0 sm:top-0 sm:opacity-0 sm:group-focus-within:pointer-events-auto sm:group-focus-within:opacity-100 sm:group-hover:pointer-events-auto sm:group-hover:opacity-100">
          <button
            {...listeners}
            {...attributes}
            onClick={(event) => event.stopPropagation()}
            className="inline-flex cursor-grab rounded-sm border-2 border-secondary bg-white p-0.5 transition sm:hover:-translate-x-0.5 sm:hover:-translate-y-0.5"
            aria-label="Drag task"
          >
            <GripVertical className="h-3 w-3 text-secondary" />
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation()
              handleStartTimer()
            }}
            className="rounded-sm border-2 border-secondary bg-white p-1 transition sm:hover:-translate-x-0.5 sm:hover:-translate-y-0.5"
            aria-label="Start timer"
          >
            <Play className="h-3 w-3 fill-secondary text-secondary" />
          </button>
          {onComplete && task.status !== 'DONE' && (
            <button
              onClick={(event) => {
                event.stopPropagation()
                onComplete(task)
              }}
              className="rounded-sm border-2 border-green-600 bg-green-100 p-1 transition sm:hover:-translate-x-0.5 sm:hover:-translate-y-0.5 sm:hover:bg-green-200"
              aria-label="Complete task"
            >
              <Check className="h-3 w-3 text-green-700" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={(event) => {
                event.stopPropagation()
                onEdit(task)
              }}
              className="rounded-sm border-2 border-secondary bg-white p-1 transition sm:hover:-translate-x-0.5 sm:hover:-translate-y-0.5"
              aria-label="Edit task"
            >
              <PencilLine className="h-3 w-3 text-secondary" />
            </button>
          )}
          <button
            onClick={(event) => {
              event.stopPropagation()
              setShowDeleteConfirm(true)
            }}
            className="rounded-sm border-2 border-red-300 bg-white p-1 transition sm:hover:-translate-x-0.5 sm:hover:-translate-y-0.5"
            aria-label="Delete task"
          >
            <Trash2 className="h-3 w-3 text-red-600" />

            <TimerSwitchDialog
              open={showConfirmDialog}
              onOpenChange={setShowConfirmDialog}
              currentTask={currentTask}
              elapsedTime={elapsedTime}
              onSaveAndSwitch={handleSaveAndSwitch}
              onDiscardAndContinue={handleDiscardAndContinue}
              isLoading={isLoading}
            />
          </button>
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

interface DraggableTaskCardProps {
  task: Task
  columnId: TaskStatus
  onEdit?: (task: Task) => void
  onComplete?: (task: Task) => void
  onView?: (task: Task) => void
  onDelete?: (task: Task) => void
}

function SortableTaskCard({ task, columnId, onEdit, onComplete, onView, onDelete }: DraggableTaskCardProps) {
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
      onDelete={onDelete}
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
              <HtmlContent
                html={task.description}
                className="max-w-full break-words text-xs text-gray-700 sm:text-sm"
              />
            ) : null}
          </div>
          <TaskMetadata task={task} />
          <TaskProgress task={task} />
          {task.createdAt && (
            <div className="flex items-center gap-2 border-t border-dashed border-secondary/20 pt-4 text-xs text-gray-600">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>Created on {formatDate(task.createdAt, 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
