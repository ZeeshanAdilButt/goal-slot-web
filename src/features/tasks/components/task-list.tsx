import { useMemo } from 'react'

import { GroupBy, Task } from '@/features/tasks/utils/types'
import { groupTasks } from '@/features/tasks/utils/utils'

import { cn } from '@/lib/utils'

import { TaskListItem } from './task-list-item/task-list-item'

interface TaskListProps {
  tasks: Task[]
  groupBy: GroupBy
  onComplete?: (task: Task) => void
  onEdit?: (task: Task) => void
}

export function TaskList({ tasks, groupBy, onComplete, onEdit }: TaskListProps) {
  const groupedTasks = useMemo(() => groupTasks(tasks, groupBy), [tasks, groupBy])

  if (!tasks.length) {
    return (
      <div className="px-4 md:-ml-[3px] md:px-0">
        <div className="card-brutal p-2 text-center font-mono text-gray-600 sm:p-6">
          No tasks yet. Create one to link it to your schedule and goals.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 px-4 md:-ml-[3px] md:space-y-6 md:px-0">
      {groupedTasks.map(([group, groupTasks]) => (
        <div key={group} className={cn('card-brutal p-3 sm:p-4', group === 'DONE' ? 'bg-gray-50 opacity-75' : '')}>
          <div className="mb-2 flex items-center justify-between sm:mb-3">
            <h3
              className={cn(
                'font-display text-sm sm:text-base font-bold uppercase',
                group === 'DOING' ? 'text-accent-blue' : '',
              )}
            >
              {group.replace('_', ' ')}
            </h3>
            <span
              className={cn(
                'badge-brutal text-[10px] sm:text-xs flex-shrink-0',
                group === 'DOING' ? 'bg-accent-blue text-white' : '',
              )}
            >
              {groupTasks.length}
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {groupTasks.map((task) => (
              <TaskListItem key={task.id} task={task} onComplete={onComplete} onEdit={onEdit} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
