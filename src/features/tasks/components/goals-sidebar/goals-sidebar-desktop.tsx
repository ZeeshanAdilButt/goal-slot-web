import { useEffect, useState } from 'react'

import { GoalModal } from '@/features/goals/components/goal-modal'
import { useReorderGoalsMutation } from '@/features/goals/hooks/use-goals-mutations'
import type { Goal as FullGoal } from '@/features/goals/utils/types'
import type { Goal as TaskGoal } from '@/features/tasks/utils/types'
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, PanelLeft, Pencil, Plus, Target } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Loading } from '@/components/ui/loading'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { GOAL_STATUS_OPTIONS, GoalsSidebarProps, WITHOUT_GOALS_ID } from './types'

function SortableGoalItem({
  goal,
  isSelected,
  isActiveNow,
  onSelect,
  onEdit,
}: {
  goal: TaskGoal
  isSelected: boolean
  isActiveNow?: boolean
  onSelect: () => void
  onEdit: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: goal.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
  }

  return (
    <div ref={setNodeRef} style={style} className={cn('group relative', isDragging && 'opacity-50')}>
      <div
        className={cn(
          'flex w-full cursor-pointer items-center gap-2 border border-zinc-200 px-2 py-2 text-left text-xs font-bold uppercase transition-all',
          isSelected
            ? 'bg-primary text-zinc-900 shadow-sm -translate-x-0.5 -translate-y-0.5'
            : 'bg-white hover:bg-gray-50 hover:shadow-sm hover:-translate-x-0.5 hover:-translate-y-0.5',
        )}
        onClick={onSelect}
      >
        <div
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="cursor-grab hover:bg-gray-100"
        >
          <GripVertical className="h-3 w-3 text-gray-400" />
        </div>
        <span className="inline-block h-2 w-2 flex-shrink-0 rounded-full" style={{ background: goal.color }} />
        <span className="flex-1 truncate">{goal.title}</span>
        {isActiveNow && (
          <span
            className="rounded bg-emerald-100 px-1 py-[1px] text-xs font-bold uppercase tracking-wider text-emerald-700"
            title="A schedule block linked to this goal is happening right now"
          >
            On now
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          className="opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
        >
          <Pencil className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

export function GoalsSidebarDesktop({
  goals,
  selectedGoalId,
  onSelectGoal,
  selectedStatus,
  onSelectStatus,
  isLoading,
  onToggleCollapse,
  activeGoalIds,
  upcomingTodayIds,
  pastTodayIds,
  goalNextBlockMinutes,
}: GoalsSidebarProps) {
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<FullGoal | null>(null)
  const [orderedGoals, setOrderedGoals] = useState(goals)
  const [activeId, setActiveId] = useState<string | null>(null)

  const reorderGoalsMutation = useReorderGoalsMutation()

  useEffect(() => {
    // Schedule-aware sort: goals with schedule blocks float to the top in
    // order of how soon their next occurrence is (active now -> 0; today
    // 2pm -> 120; tomorrow 9am -> 1980; etc). Unscheduled goals stay in
    // their upstream order at the bottom so the user can still drag-reorder
    // them. Drag is still available across the whole list and the new
    // order persists via useReorderGoalsMutation.
    if (!goalNextBlockMinutes || goalNextBlockMinutes.size === 0) {
      setOrderedGoals(goals)
      return
    }
    const withKey = goals.map((g, idx) => ({
      g,
      idx,
      key: goalNextBlockMinutes.get(g.id) ?? Number.POSITIVE_INFINITY,
    }))
    withKey.sort((a, b) => (a.key === b.key ? a.idx - b.idx : a.key - b.key))
    setOrderedGoals(withKey.map((x) => x.g))
  }, [goals, goalNextBlockMinutes])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      setOrderedGoals((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)

        reorderGoalsMutation.mutate(newItems.map((g) => g.id))

        return newItems
      })
    }
  }

  const handleNewGoal = () => {
    setEditingGoal(null)
    setShowModal(true)
  }

  const handleEditGoal = (goal: TaskGoal) => {
    // Cast to FullGoal for the modal - the modal handles missing fields
    setEditingGoal(goal as unknown as FullGoal)
    setShowModal(true)
  }

  const activeGoal = activeId ? orderedGoals.find((g) => g.id === activeId) : null

  return (
    <>
      <aside className="hidden h-full w-full min-w-0 flex-shrink-0 flex-col border-r border-zinc-200 bg-[#fafafa] md:flex">
        <div className="flex-shrink-0 border-b border-zinc-200 px-2 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="text-lg font-bold uppercase">Goals</span>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedStatus} onValueChange={onSelectStatus}>
                <SelectTrigger className="h-8 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {onToggleCollapse ? (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="flex h-8 w-8 items-center justify-center border border-zinc-200 bg-primary text-zinc-900 shadow-sm transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-sm active:translate-x-1 active:translate-y-1 active:shadow-none"
                  aria-label="Collapse goals sidebar"
                  title="Collapse goals sidebar"
                >
                  <PanelLeft className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-4">
          {isLoading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <Loading size="sm" />
            </div>
          ) : (
            <div className="space-y-1">
              {/* Without Goals option */}
              <button
                onClick={() => onSelectGoal(WITHOUT_GOALS_ID)}
                className={cn(
                  'flex w-full items-center gap-2 border border-zinc-200 px-2 py-2 text-left text-xs font-bold uppercase transition-all',
                  selectedGoalId === WITHOUT_GOALS_ID
                    ? 'bg-primary text-zinc-900 shadow-sm -translate-x-0.5 -translate-y-0.5'
                    : 'bg-white hover:bg-gray-50 hover:shadow-sm hover:-translate-x-0.5 hover:-translate-y-0.5',
                )}
              >
                <div className="w-3" /> {/* Spacer for alignment with drag handle */}
                <span className="inline-block h-2 w-2 flex-shrink-0 rounded-full bg-gray-400" />
                <span className="truncate">Without Goals</span>
              </button>

              {orderedGoals.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center shadow-sm">
                  <p className="font-mono text-sm text-gray-600">No goals</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={orderedGoals.map((g) => g.id)} strategy={verticalListSortingStrategy}>
                    {(() => {
                      const onNow: TaskGoal[] = []
                      const upcomingToday: TaskGoal[] = []
                      const pastToday: TaskGoal[] = []
                      const laterWeek: TaskGoal[] = []
                      const unscheduled: TaskGoal[] = []
                      orderedGoals.forEach((g) => {
                        if (activeGoalIds?.has(g.id)) onNow.push(g)
                        else if (upcomingTodayIds?.has(g.id)) upcomingToday.push(g)
                        else if (pastTodayIds?.has(g.id)) pastToday.push(g)
                        else if (goalNextBlockMinutes?.has(g.id)) laterWeek.push(g)
                        else unscheduled.push(g)
                      })
                      const sectionLabel = (text: string, accent?: string) => (
                        <div
                          className={cn(
                            'mt-3 mb-1 flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-[0.12em] first:mt-0',
                            accent ?? 'text-zinc-400',
                          )}
                        >
                          <span className="h-px flex-1 bg-zinc-200" aria-hidden />
                          <span>{text}</span>
                          <span className="h-px flex-1 bg-zinc-200" aria-hidden />
                        </div>
                      )
                      const renderItem = (goal: TaskGoal, opts?: { dim?: boolean; activeNow?: boolean }) => (
                        <div key={goal.id} className={opts?.dim ? 'opacity-60' : undefined}>
                          <SortableGoalItem
                            goal={goal}
                            isSelected={selectedGoalId === goal.id}
                            isActiveNow={opts?.activeNow}
                            onSelect={() => onSelectGoal(goal.id)}
                            onEdit={() => handleEditGoal(goal)}
                          />
                        </div>
                      )
                      return (
                        <>
                          {onNow.length > 0 && (
                            <>
                              {sectionLabel('On now', 'text-emerald-600')}
                              {onNow.map((g) => renderItem(g, { activeNow: true }))}
                            </>
                          )}
                          {upcomingToday.length > 0 && (
                            <>
                              {sectionLabel('Upcoming today', 'text-[#8a7307]')}
                              {upcomingToday.map((g) => renderItem(g))}
                            </>
                          )}
                          {pastToday.length > 0 && (
                            <>
                              {sectionLabel('Done today')}
                              {pastToday.map((g) => renderItem(g, { dim: true }))}
                            </>
                          )}
                          {laterWeek.length > 0 && (
                            <>
                              {sectionLabel('Later this week')}
                              {laterWeek.map((g) => renderItem(g))}
                            </>
                          )}
                          {unscheduled.length > 0 && (
                            <>
                              {(onNow.length > 0 ||
                                upcomingToday.length > 0 ||
                                pastToday.length > 0 ||
                                laterWeek.length > 0) &&
                                sectionLabel('No schedule')}
                              {unscheduled.map((g) => renderItem(g))}
                            </>
                          )}
                        </>
                      )
                    })()}
                  </SortableContext>
                  <DragOverlay>
                    {activeGoal ? (
                      <div className="shadow-sm-2xl flex w-full items-center gap-2 border border-zinc-200 bg-white px-2 py-2 text-left text-xs font-bold uppercase opacity-80 outline outline-2 outline-primary">
                        <GripVertical className="h-3 w-3 text-gray-400" />
                        <span
                          className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
                          style={{ background: activeGoal.color }}
                        />
                        <span className="truncate">{activeGoal.title}</span>
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              )}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-zinc-200 px-2 py-4">
          <button
            onClick={handleNewGoal}
            className="flex w-full items-center justify-center gap-2 border border-zinc-200 bg-white px-2 py-2 text-sm font-bold uppercase transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-primary hover:shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>New Goal</span>
          </button>
        </div>
      </aside>

      <GoalModal isOpen={showModal} onClose={() => setShowModal(false)} goal={editingGoal} />
    </>
  )
}
