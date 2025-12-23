import { useMemo, useState } from 'react'

import { GroupBy, Task } from '@/features/tasks/utils/types'
import { groupTasks } from '@/features/tasks/utils/utils'

import { cn } from '@/lib/utils'

import { CompactTaskListItem } from './compact-task-list-item/compact-task-list-item'

interface CompactTaskListProps {
  tasks: Task[]
  groupBy: GroupBy
  onEdit: (task: Task) => void
  onComplete?: (task: Task) => void
}

export function CompactTaskList({ tasks, groupBy, onEdit, onComplete }: CompactTaskListProps) {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null)

  const groupedTasks = useMemo(() => groupTasks(tasks, groupBy), [tasks, groupBy])

  if (tasks.length === 0) {
    return (
      <div className="px-4 md:-ml-[3px] md:px-0">
        <div className="card-brutal p-4 text-center font-mono text-sm text-gray-600">No tasks found</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 px-4 md:-ml-[3px] md:px-0">
      {groupedTasks.map(([group, groupTasks]) => (
        <div key={group} className="space-y-2">
          {/* Group Header */}
          <div className="flex items-center justify-between px-2 md:px-4">
            <h3
              className={cn(
                'font-display text-xs md:text-sm font-bold uppercase',
                group === 'IN_PROGRESS' ? 'text-accent-blue' : 'text-gray-700',
              )}
            >
              {group.replace('_', ' ')}
            </h3>
            <span
              className={cn(
                'px-2 py-0.5 text-[10px] md:text-xs font-bold uppercase border-2 border-secondary flex-shrink-0',
                group === 'IN_PROGRESS' ? 'bg-accent-blue text-white' : 'bg-white text-secondary',
              )}
            >
              {groupTasks.length}
            </span>
          </div>

          {/* Group Tasks */}
          <div className="space-y-2">
            {groupTasks.map((task) => (
              <CompactTaskListItem
                key={task.id}
                task={task}
                isExpanded={expandedTaskId === task.id}
                isHovered={hoveredTaskId === task.id}
                onExpand={setExpandedTaskId}
                onHover={setHoveredTaskId}
                onEdit={onEdit}
                onComplete={onComplete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
