'use client'

import { useState } from 'react'

import { CompactTaskList } from '@/features/tasks/components/compact-task-list'
import { TaskList } from '@/features/tasks/components/task-list'
import { TasksFilters } from '@/features/tasks/components/tasks-filters'
import { GroupBy, Task } from '@/features/tasks/utils/types'
import { Plus } from 'lucide-react'

interface TasksViewProps {
  tasks: Task[]
  onComplete: (task: Task) => void
  onEdit: (task: Task) => void
  onCreate: () => void
  hasSelectedGoal: boolean
}

export function TasksView({ tasks, onComplete, onEdit, onCreate, hasSelectedGoal }: TasksViewProps) {
  const [showCompletedTasks, setShowCompletedTasks] = useState(false)
  const [compactView, setCompactView] = useState(false)
  const [groupBy, setGroupBy] = useState<GroupBy>('status')

  const activeTasks = tasks.filter((t) => t.status !== 'COMPLETED')
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED')
  const displayedTasks = showCompletedTasks ? tasks : activeTasks

  if (!hasSelectedGoal) {
    return <div className="text-gray-400">Select a goal to view tasks.</div>
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="font-display text-4xl font-bold uppercase">Tasks</h1>
          <button
            onClick={onCreate}
            className="btn-brutal flex items-center gap-2 px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>New Task</span>
          </button>
        </div>
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
      <div className="pb-4">
        {compactView ? (
          <CompactTaskList tasks={displayedTasks} groupBy={groupBy} onEdit={onEdit} onComplete={onComplete} />
        ) : (
          <TaskList tasks={displayedTasks} groupBy={groupBy} onComplete={onComplete} onEdit={onEdit} />
        )}
      </div>
    </div>
  )
}
