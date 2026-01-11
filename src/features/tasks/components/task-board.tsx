"use client"

import type { CSSProperties, ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"

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
} from "@dnd-kit/core"
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Check, GripVertical, PencilLine, Play } from "lucide-react"

import { useUpdateTaskMutation, useReorderTasksMutation } from "@/features/tasks/hooks/use-tasks-mutations"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { taskStatusStyles } from "@/features/tasks/utils/task-status-styles"
import { Task, TaskStatus } from "@/features/tasks/utils/types"

import { cn } from "@/lib/utils"

const STATUS_LABELS: Record<TaskStatus, string> = {
  BACKLOG: "Backlog",
  TODO: "To Do",
  DOING: "Doing",
  DONE: "Done",
}

const BOARD_COLUMNS: Array<{ id: TaskStatus; title: string; helper: string; accent: string; text: string }> = [
  { id: "BACKLOG", title: "Backlog", helper: "Capture ideas", accent: "bg-gray-50", text: "text-gray-700" },
  { id: "TODO", title: "To Do", helper: "Ready to start next", accent: "bg-amber-50", text: "text-secondary" },
  { id: "DOING", title: "Doing", helper: "In motion right now", accent: "bg-blue-50", text: "text-blue-700" },
  { id: "DONE", title: "Done", helper: "Shipped and finished", accent: "bg-green-50", text: "text-green-700" },
]

interface TaskBoardProps {
  tasks: Task[]
  onEdit?: (task: Task) => void
  onComplete?: (task: Task) => void
}

export function TaskBoard({ tasks, onEdit, onComplete }: TaskBoardProps) {
  const updateTaskMutation = useUpdateTaskMutation()
  const reorderTasksMutation = useReorderTasksMutation()
  
  // Group tasks by status locally to handle drag and drop optimistic updates properly
  const [columns, setColumns] = useState<Record<TaskStatus, Task[]>>({
    BACKLOG: [],
    TODO: [],
    DOING: [],
    DONE: [],
  })

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

  // Sync props to local state whenever tasks change
  useEffect(() => {
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
    setActiveTaskId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    const activeId = String(active.id)
    const overId = over ? String(over.id) : null

    setActiveTaskId(null)
    if (!overId) return

    const activeType = active.data.current?.type as string | undefined
    const overType = over.data.current?.type as string | undefined
    const activeColumn = active.data.current?.columnId as TaskStatus | undefined
    const overColumnFromTask = over.data.current?.columnId as TaskStatus | undefined

    const sourceColumn = activeColumn
    // If dropped on a column droppable, use that. Otherwise use the task's column.
    // Also handle case where overId matches a column name directly.
    let targetColumn: TaskStatus | undefined = overType === "column" ? (over.id as TaskStatus) : overColumnFromTask
    
    // Fallback: check if overId is a column ID
    if (!targetColumn && BOARD_COLUMNS.some(c => c.id === overId)) {
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

    if (targetColumn === "DONE" && onComplete) {
      onComplete(updatedTask)
    }
  }

  const handleStatusChange = (task: Task, newStatus: TaskStatus) => {
    if (task.status === newStatus) return
    
    // Optimistic update
    setColumns((prev) => {
      const next = { ...prev }
      next[task.status] = prev[task.status].filter((t) => t.id !== task.id)
      next[newStatus] = [...prev[newStatus], { ...task, status: newStatus }]
      return next
    })
    
    updateTaskMutation.mutate({ taskId: task.id, data: { status: newStatus } })
    
    if (newStatus === "DONE" && onComplete) {
      onComplete({ ...task, status: newStatus })
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex w-full snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-6 scrollbar-hide">
        {BOARD_COLUMNS.map((colDef) => (
          <BoardColumn 
            key={colDef.id} 
            column={{...colDef, tasks: columns[colDef.id]}}
          >
            {columns[colDef.id].map((task) => (
              <SortableTaskCard key={task.id} task={task} columnId={colDef.id} onEdit={onEdit} onComplete={onComplete} onStatusChange={handleStatusChange} />
            ))}
          </BoardColumn>
        ))}
      </div>

      <DragOverlay>
        {activeTaskId ? (
          // Find the task in columns to render overlay
          <TaskCard 
             task={Object.values(columns).flat().find(t => t.id === activeTaskId) as Task} 
             dragging 
          />
        ) : null}
      </DragOverlay>
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
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { type: "column" } })
  const taskIds = useMemo(() => column.tasks.map((t) => t.id), [column.tasks])

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "card-brutal flex min-h-[260px] min-w-[280px] snap-center flex-col gap-3 p-3 sm:min-w-[320px] sm:p-4 md:min-w-[350px]",
        column.accent,
        isOver ? "ring-2 ring-secondary" : "ring-0",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-sm font-bold uppercase text-secondary sm:text-base">{column.title}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary/70 sm:text-xs">{column.helper}</p>
        </div>
        <span className="badge-brutal text-[11px] sm:text-xs">{column.tasks.length}</span>
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-3">
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
  onStatusChange?: (task: Task, status: TaskStatus) => void
  listeners?: any
  attributes?: any
  setNodeRef?: (element: HTMLElement | null) => void
  style?: CSSProperties
  dragging?: boolean
}

function TaskCard({ task, onEdit, onComplete, onStatusChange, listeners, attributes, setNodeRef, style, dragging = false }: TaskCardProps) {
  const statusStyle = taskStatusStyles[task.status]

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "card-brutal group relative flex flex-col gap-2 overflow-hidden p-3 transition-all sm:p-3.5",
        dragging ? "shadow-brutal" : "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal",
      )}
    >
      <div aria-hidden className={cn("pointer-events-none absolute inset-0 opacity-70", statusStyle.glow)} />

      <div className="relative flex items-start gap-2">
        <button
          {...listeners}
          {...attributes}
          className="mt-0.5 inline-flex cursor-grab rounded-sm border-2 border-secondary bg-white p-1 shadow-brutal-sm transition group-hover:-translate-x-0.5 group-hover:-translate-y-0.5"
          aria-label="Drag task"
        >
          <GripVertical className="h-3.5 w-3.5 text-secondary" />
        </button>

        <div className="relative flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.(task)
              }}
              className="cursor-pointer font-display text-sm font-bold uppercase leading-tight text-secondary transition-colors hover:text-primary hover:underline sm:text-base"
            >
              {task.title}
            </h3>
            {task.estimatedMinutes ? (
              <span className="badge-brutal text-[10px] sm:text-xs">
                {parseFloat((task.estimatedMinutes / 60).toFixed(2))}h
              </span>
            ) : null}
          </div>
          {task.description ? (
            <div className="line-clamp-2 text-[11px] leading-relaxed text-secondary/80 sm:text-xs" dangerouslySetInnerHTML={{ __html: task.description || '' }} />
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            {task.goal?.title ? (
              <span className="rounded-sm border-2 border-secondary bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-secondary shadow-brutal-sm">
                {task.goal.title}
              </span>
            ) : null}
            {task.dueDate ? (
              <span className="rounded-sm border border-dashed border-secondary/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary/80">
                Due {new Date(task.dueDate).toLocaleDateString()}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="relative mt-2 flex items-center justify-between gap-2">
        {onStatusChange ? (
          <Select 
            value={task.status} 
            onValueChange={(value) => onStatusChange(task, value as TaskStatus)}
          >
            <SelectTrigger 
              className={cn(
                "h-6 w-auto gap-1 border-2 px-2 text-[10px] font-bold uppercase shadow-brutal-sm sm:text-xs",
                statusStyle.badge
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BOARD_COLUMNS.map((col) => (
                <SelectItem key={col.id} value={col.id}>
                  {col.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className={cn("badge-brutal text-[10px] sm:text-xs", statusStyle.badge)}>{STATUS_LABELS[task.status]}</span>
        )}
        <div className="flex items-center gap-1.5">
          <button
            className="rounded-sm border-2 border-secondary bg-white p-1.5 shadow-brutal-sm transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal"
            aria-label="Start timer"
          >
            <Play className="h-4 w-4 fill-secondary text-secondary" />
          </button>
          {onComplete && task.status !== "DONE" && (
            <button
              onClick={() => onComplete(task)}
              className="rounded-sm border-2 border-green-600 bg-green-100 p-1.5 shadow-brutal-sm transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-green-200 hover:shadow-brutal"
              aria-label="Complete task"
            >
              <Check className="h-4 w-4 text-green-700" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              className="rounded-sm border-2 border-secondary bg-white p-1.5 shadow-brutal-sm transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal"
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
  onStatusChange?: (task: Task, status: TaskStatus) => void
}

function SortableTaskCard({ task, columnId, onEdit, onComplete, onStatusChange }: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", columnId },
  })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
    visibility: isDragging ? 'hidden' : 'visible',
  }

  return (
    <TaskCard
      task={task}
      onEdit={onEdit}
      onComplete={onComplete}
      onStatusChange={onStatusChange}
      listeners={listeners}
      attributes={attributes}
      setNodeRef={setNodeRef}
      style={style}
      dragging={isDragging}
    />
  )
}
