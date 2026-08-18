'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

import { useReorderTasksMutation, useUpdateTaskMutation } from '@/features/tasks/hooks/use-tasks-mutations'
import { GroupBy, Task, TaskStatus } from '@/features/tasks/utils/types'
import { groupTasks } from '@/features/tasks/utils/utils'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

import { cn } from '@/lib/utils'
import VirtualizedList from '@/components/virtualized-list'

import { CompactTaskListItem } from './compact-task-list-item/compact-task-list-item'

interface CompactTaskListProps {
  tasks: Task[]
  groupBy: GroupBy
  onEdit: (task: Task) => void
  onComplete?: (task: Task) => void
}

export function CompactTaskList({ tasks, groupBy, onEdit, onComplete }: CompactTaskListProps) {
  // Drag-and-drop reordering only makes sense for the status grouping - the
  // other groupings (day, schedule block) aren't statuses a task can be
  // dropped into, so there's nothing coherent to reorder or move between.
  if (groupBy === 'status') {
    return <StatusGroupedTaskList tasks={tasks} onEdit={onEdit} onComplete={onComplete} />
  }

  return <StaticGroupedTaskList tasks={tasks} groupBy={groupBy} onEdit={onEdit} onComplete={onComplete} />
}

// Every status section is always rendered, even when empty, so a task can be
// dragged into a status that currently has none - matching the board view,
// which always shows all four columns for the same reason.
const STATUS_SECTIONS: Array<{ id: TaskStatus; title: string }> = [
  { id: 'BACKLOG', title: 'BACKLOG' },
  { id: 'TODO', title: 'TO DO' },
  { id: 'DOING', title: 'DOING' },
  { id: 'DONE', title: 'DONE' },
]

function StatusGroupedTaskList({
  tasks,
  onEdit,
  onComplete,
}: {
  tasks: Task[]
  onEdit: (task: Task) => void
  onComplete?: (task: Task) => void
}) {
  const updateTaskMutation = useUpdateTaskMutation()
  const reorderTasksMutation = useReorderTasksMutation()

  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null)

  // Track drag operations to prevent the props->state sync effect below from
  // clobbering the optimistic in-flight reorder/move while dragging.
  const isDraggingRef = useRef(false)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

  const [columns, setColumns] = useState<Record<TaskStatus, Task[]>>({
    BACKLOG: [],
    TODO: [],
    DOING: [],
    DONE: [],
  })

  useEffect(() => {
    if (isDraggingRef.current) return

    const next: Record<TaskStatus, Task[]> = { BACKLOG: [], TODO: [], DOING: [], DONE: [] }
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
    setTimeout(() => {
      isDraggingRef.current = false
    }, 100)

    if (!overId || !over) return

    const overType = over.data.current?.type as string | undefined
    const activeColumn = active.data.current?.columnId as TaskStatus | undefined
    const overColumnFromTask = over.data.current?.columnId as TaskStatus | undefined

    const sourceColumn = activeColumn
    let targetColumn: TaskStatus | undefined = overType === 'column' ? (over.id as TaskStatus) : overColumnFromTask
    if (!targetColumn && STATUS_SECTIONS.some((s) => s.id === overId)) {
      targetColumn = overId as TaskStatus
    }

    if (!sourceColumn || !targetColumn) return

    const next = { ...columns }
    const sourceItems = [...next[sourceColumn]]
    const movingIndex = sourceItems.findIndex((t) => t.id === activeId)
    if (movingIndex === -1) return
    const movingTask = sourceItems[movingIndex]

    if (sourceColumn === targetColumn) {
      const overIndex = sourceItems.findIndex((t) => t.id === overId)
      if (overIndex === -1 || movingIndex === overIndex) return

      const reordered = arrayMove(sourceItems, movingIndex, overIndex)
      next[sourceColumn] = reordered
      setColumns(next)
      reorderTasksMutation.mutate(reordered.map((t) => t.id))
      return
    }

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

  if (tasks.length === 0) {
    return (
      <div className="px-1 md:-ml-[3px] md:px-0">
        <div className="rounded-xl border border-zinc-200 bg-white p-3 p-4 text-center font-mono text-sm text-gray-600 shadow-sm">No tasks found</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-1 md:-ml-[3px] md:px-0">
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {STATUS_SECTIONS.map((section) => (
          <StatusSection
            key={section.id}
            section={section}
            tasks={columns[section.id]}
            hoveredTaskId={hoveredTaskId}
            onHover={setHoveredTaskId}
            onEdit={onEdit}
            onComplete={onComplete}
          />
        ))}
      </DndContext>
    </div>
  )
}

function StatusSection({
  section,
  tasks,
  hoveredTaskId,
  onHover,
  onEdit,
  onComplete,
}: {
  section: { id: TaskStatus; title: string }
  tasks: Task[]
  hoveredTaskId: string | null
  onHover: (taskId: string | null) => void
  onEdit: (task: Task) => void
  onComplete?: (task: Task) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: section.id, data: { type: 'column' } })
  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks])

  return (
    <div ref={setNodeRef} className={cn('rounded-md', isOver && 'ring-2 ring-yellow-400/40')}>
      <div className="px-1 pb-1 pt-1 md:px-3">
        <div className="flex items-center justify-between">
          <h3
            className={cn(
              'font-display text-xs md:text-sm font-bold uppercase',
              section.id === 'DOING' ? 'text-accent-blue' : 'text-gray-700',
            )}
          >
            {section.title}
          </h3>
          <span
            className={cn(
              'px-2 py-0.5 text-[10px] md:text-xs font-bold uppercase border border-zinc-200 flex-shrink-0',
              section.id === 'DOING' ? 'bg-sky-50 text-white' : 'bg-white text-zinc-900',
            )}
          >
            {tasks.length}
          </span>
        </div>
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        {tasks.length ? (
          tasks.map((task) => (
            <div key={task.id} className="pb-1">
              <SortableCompactRow
                task={task}
                columnId={section.id}
                isHovered={hoveredTaskId === task.id}
                onHover={onHover}
                onEdit={onEdit}
                onComplete={onComplete}
              />
            </div>
          ))
        ) : (
          <div className="mb-1 flex items-center justify-center rounded-md border border-dashed border-zinc-200 px-2 py-3 text-center text-[11px] font-medium text-zinc-400">
            Drop tasks here
          </div>
        )}
      </SortableContext>
    </div>
  )
}

function SortableCompactRow({
  task,
  columnId,
  isHovered,
  onHover,
  onEdit,
  onComplete,
}: {
  task: Task
  columnId: TaskStatus
  isHovered: boolean
  onHover: (taskId: string | null) => void
  onEdit: (task: Task) => void
  onComplete?: (task: Task) => void
}) {
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
    <div ref={setNodeRef} style={style} className="flex items-stretch gap-1.5">
      <button
        {...listeners}
        {...attributes}
        onClick={(e) => e.stopPropagation()}
        className="flex w-5 flex-shrink-0 cursor-grab items-center justify-center rounded-sm border border-zinc-200 bg-white text-zinc-400 transition hover:text-zinc-700 sm:w-6"
        aria-label="Drag task"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <div className="min-w-0 flex-1">
        <CompactTaskListItem
          task={task}
          isHovered={isHovered}
          onHover={onHover}
          onEdit={onEdit}
          onComplete={onComplete}
        />
      </div>
    </div>
  )
}

function StaticGroupedTaskList({
  tasks,
  groupBy,
  onEdit,
  onComplete,
}: {
  tasks: Task[]
  groupBy: GroupBy
  onEdit: (task: Task) => void
  onComplete?: (task: Task) => void
}) {
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null)

  const groupedTasks = useMemo(() => groupTasks(tasks, groupBy), [tasks, groupBy])
  const rows = useMemo(() => {
    return groupedTasks.flatMap(([group, groupTasks]) => {
      const sectionRows: Array<
        { type: 'header'; group: string; count: number } | { type: 'row'; group: string; task: Task }
      > = [{ type: 'header', group, count: groupTasks.length }]

      groupTasks.forEach((task) => {
        sectionRows.push({ type: 'row', group, task })
      })

      return sectionRows
    })
  }, [groupedTasks])

  if (tasks.length === 0) {
    return (
      <div className="px-1 md:-ml-[3px] md:px-0">
        <div className="rounded-xl border border-zinc-200 bg-white p-3 p-4 text-center font-mono text-sm text-gray-600 shadow-sm">No tasks found</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col px-1 md:-ml-[3px] md:px-0">
      <VirtualizedList
        items={rows}
        getItemKey={(row) => (row.type === 'header' ? `header-${row.group}` : `row-${row.task.id}`)}
        estimateSize={96}
        className="min-h-0 flex-1"
        height="100%"
        renderItem={({ item }) =>
          item.type === 'header' ? (
            <div className="px-1 pb-1 pt-1 md:px-3">
              <div className="flex items-center justify-between">
                <h3
                  className={cn(
                    'font-display text-xs md:text-sm font-bold uppercase',
                    item.group === 'DOING' ? 'text-accent-blue' : 'text-gray-700',
                  )}
                >
                  {item.group.replace('_', ' ')}
                </h3>
                <span
                  className={cn(
                    'px-2 py-0.5 text-[10px] md:text-xs font-bold uppercase border border-zinc-200 flex-shrink-0',
                    item.group === 'DOING' ? 'bg-sky-50 text-white' : 'bg-white text-zinc-900',
                  )}
                >
                  {item.count}
                </span>
              </div>
            </div>
          ) : (
            <div className="pb-1">
              <CompactTaskListItem
                task={item.task}
                isHovered={hoveredTaskId === item.task.id}
                onHover={setHoveredTaskId}
                onEdit={onEdit}
                onComplete={onComplete}
              />
            </div>
          )
        }
      />
    </div>
  )
}
