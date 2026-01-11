import { useEffect, useState } from 'react'
import {
  cancelDropdown,
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
import { GoalModal } from '@/features/goals/components/goal-modal'
import { useReorderGoalsMutation } from '@/features/goals/hooks/use-goals-mutations'
import { GripVertical, Pencil, Plus, Target } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Loading } from '@/components/ui/loading'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { Goal, GOAL_STATUS_OPTIONS, GoalsSidebarProps, WITHOUT_GOALS_ID } from './types'

function SortableGoalItem({
  goal,
  isSelected,
  onSelect,
  onEdit,
}: {
  goal: Goal
  isSelected: boolean
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
          'flex w-full cursor-pointer items-center gap-2 border-3 border-secondary px-3 py-2 text-left text-xs font-bold uppercase transition-all',
          isSelected
            ? 'bg-primary text-secondary shadow-brutal-sm -translate-x-0.5 -translate-y-0.5'
            : 'bg-white hover:bg-gray-50 hover:shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5',
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
        <span className="flex-1 truncate">
          {goal.title}
        </span>
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
}: GoalsSidebarProps) {
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [orderedGoals, setOrderedGoals] = useState(goals)
  const [activeId, setActiveId] = useState<string | null>(null)
  
  const reorderGoalsMutation = useReorderGoalsMutation()

  useEffect(() => {
    setOrderedGoals(goals)
  }, [goals])

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

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal)
    setShowModal(true)
  }

  const activeGoal = activeId ? orderedGoals.find((g) => g.id === activeId) : null

  return (
    <>
      <aside className="hidden h-full w-64 flex-shrink-0 flex-col border-r-3 border-secondary bg-brutalist-bg md:flex">
        <div className="flex-shrink-0 border-b-3 border-secondary p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="text-lg font-bold uppercase">Goals</span>
            </div>
            <Select value={selectedStatus} onValueChange={onSelectStatus}>
              <SelectTrigger className="h-8 w-28 text-xs ">
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
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
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
                  'flex w-full items-center gap-2 border-3 border-secondary px-3 py-2 text-left text-xs font-bold uppercase transition-all',
                  selectedGoalId === WITHOUT_GOALS_ID
                    ? 'bg-primary text-secondary shadow-brutal-sm -translate-x-0.5 -translate-y-0.5'
                    : 'bg-white hover:bg-gray-50 hover:shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5',
                )}
              >
                <div className="w-3" /> {/* Spacer for alignment with drag handle */}
                <span className="inline-block h-2 w-2 flex-shrink-0 rounded-full bg-gray-400" />
                <span className="truncate">Without Goals</span>
              </button>

              {orderedGoals.length === 0 ? (
                <div className="card-brutal p-4 text-center">
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
                    {orderedGoals.map((goal) => (
                      <SortableGoalItem
                        key={goal.id}
                        goal={goal}
                        isSelected={selectedGoalId === goal.id}
                        onSelect={() => onSelectGoal(goal.id)}
                        onEdit={() => handleEditGoal(goal)}
                      />
                    ))}
                  </SortableContext>
                  <DragOverlay>
                    {activeGoal ? (
                      <div className="flex w-full items-center gap-2 border-3 border-secondary bg-white px-3 py-2 text-left text-xs font-bold uppercase opacity-80 shadow-brutal-2xl outline outline-2 outline-primary">
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

        <div className="flex-shrink-0 border-t-3 border-secondary p-4">
          <button
            onClick={handleNewGoal}
            className="flex w-full items-center justify-center gap-2 border-3 border-secondary bg-white px-3 py-2 text-sm font-bold uppercase transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-primary hover:shadow-brutal-sm"
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
