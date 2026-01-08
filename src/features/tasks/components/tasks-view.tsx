'use client'

import { useState } from 'react'

import { CompactTaskList } from '@/features/tasks/components/compact-task-list'
import { GoalsSidebarMobile } from '@/features/tasks/components/goals-sidebar/goals-sidebar-mobile'
import { TaskList } from '@/features/tasks/components/task-list'
import { TasksFilters } from '@/features/tasks/components/tasks-filters'
import { Goal, GroupBy, Task } from '@/features/tasks/utils/types'
import { Plus } from 'lucide-react'

import { GoalSlotSpinner } from '@/components/goalslot-logo'

interface TasksViewProps {
  tasks: Task[]
  onComplete: (task: Task) => void
  onEdit: (task: Task) => void
  onCreate: () => void
  hasSelectedGoal: boolean
  isLoading: boolean
  goals?: Goal[]
  selectedGoalId?: string | null
  onSelectGoal?: (id: string | null) => void
  selectedStatus?: string
  onSelectStatus?: (status: string) => void
  goalsLoading?: boolean
}

export function TasksView({
  tasks,
  onComplete,
  onEdit,
  onCreate,
  hasSelectedGoal,
  isLoading,
  goals = [],
  selectedGoalId = null,
  onSelectGoal,
  selectedStatus = 'ACTIVE',
  onSelectStatus,
  goalsLoading = false,
}: TasksViewProps) {
  const [showCompletedTasks, setShowCompletedTasks] = useState(false)
  const [compactView, setCompactView] = useState(false)
  const [groupBy, setGroupBy] = useState<GroupBy>('status')

  const activeTasks = tasks.filter((t) => t.status !== 'COMPLETED')
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED')
  const displayedTasks = showCompletedTasks ? tasks : activeTasks

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <GoalSlotSpinner size="md" />
      </div>
    )
  }

  if (!hasSelectedGoal) {
    return (
      <div className="p-4 sm:p-6">
        <div className="px-0 sm:px-4 md:-ml-[3px] md:px-0">
          <div className="card-brutal p-4 text-center font-mono text-sm text-gray-600 sm:p-6 sm:text-base">
            Select a goal to view tasks.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold uppercase sm:text-3xl md:text-4xl">Tasks</h1>
          <button
            onClick={onCreate}
            className="btn-brutal flex items-center gap-2 px-3 py-2 text-sm sm:px-4 sm:py-2 md:px-6 md:py-3 md:text-base"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">New Task</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>

        {/* Mobile Goals Selector - Below Tasks Header */}
        {onSelectGoal && onSelectStatus && (
          <div className="mb-4 md:hidden">
            <GoalsSidebarMobile
              goals={goals}
              selectedGoalId={selectedGoalId}
              onSelectGoal={onSelectGoal}
              selectedStatus={selectedStatus}
              onSelectStatus={onSelectStatus}
              isLoading={goalsLoading}
            />
          </div>
        )}

        <TasksFilters
          compactView={compactView}
          onCompactViewChange={setCompactView}
          showCompleted={showCompletedTasks}
          onShowCompletedChange={setShowCompletedTasks}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
        />
      </div>

      {/* Tasks List */}
      <div className="pb-4 sm:pb-6">
        {compactView ? (
          <CompactTaskList tasks={displayedTasks} groupBy={groupBy} onEdit={onEdit} onComplete={onComplete} />
        ) : (
          <TaskList tasks={displayedTasks} groupBy={groupBy} onComplete={onComplete} onEdit={onEdit} />
        )}
      </div>
    </div>
  )
}
