import { useMemo, useState } from 'react'

import { GroupBy, Task } from '@/features/tasks/utils/types'
import { groupTasks } from '@/features/tasks/utils/utils'
import { Calendar, Layers } from 'lucide-react'

import { cn } from '@/lib/utils'

import { TaskListItem } from './task-list-item/task-list-item'

interface TaskListProps {
  tasks: Task[]
  onComplete?: (task: Task) => void
  onEdit?: (task: Task) => void
}

export function TaskList({ tasks, onComplete, onEdit }: TaskListProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>('status')

  const groupedTasks = useMemo(() => groupTasks(tasks, groupBy), [tasks, groupBy])

  if (!tasks.length) {
    return (
      <div className="card-brutal p-6 text-center font-mono text-gray-600">
        No tasks yet. Create one to link it to your schedule and goals.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs font-bold uppercase text-gray-500">Group by:</span>
        <div className="flex rounded-md border-2 border-black bg-white p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <button
            onClick={() => setGroupBy('status')}
            className={cn(
              'flex items-center gap-1 rounded px-2 py-1 text-xs font-bold uppercase transition-colors',
              groupBy === 'status' ? 'bg-primary text-secondary' : 'hover:bg-gray-100',
            )}
          >
            <Layers className="h-3 w-3" />
            Status
          </button>
          <button
            onClick={() => setGroupBy('day')}
            className={cn(
              'flex items-center gap-1 rounded px-2 py-1 text-xs font-bold uppercase transition-colors',
              groupBy === 'day' ? 'bg-primary text-secondary' : 'hover:bg-gray-100',
            )}
          >
            <Calendar className="h-3 w-3" />
            Day
          </button>
        </div>
      </div>

      {groupedTasks.map(([group, groupTasks]) => (
        <div key={group} className={cn('card-brutal p-4', group === 'COMPLETED' ? 'bg-gray-50 opacity-75' : '')}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className={cn('font-display font-bold uppercase', group === 'IN_PROGRESS' ? 'text-primary' : '')}>
              {group.replace('_', ' ')}
            </h3>
            <span className={cn('badge-brutal text-xs', group === 'IN_PROGRESS' ? 'bg-primary text-secondary' : '')}>
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
