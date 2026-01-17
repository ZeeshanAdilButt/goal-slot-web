import { useMemo, useState } from 'react'

import { GroupBy, Task } from '@/features/tasks/utils/types'
import { groupTasks } from '@/features/tasks/utils/utils'

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
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
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
        <div className="card-brutal p-3 text-center font-mono text-sm text-gray-600">No tasks found</div>
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
                    'px-2 py-0.5 text-[10px] md:text-xs font-bold uppercase border-2 border-secondary flex-shrink-0',
                    item.group === 'DOING' ? 'bg-accent-blue text-white' : 'bg-white text-secondary',
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
                isExpanded={expandedTaskId === item.task.id}
                isHovered={hoveredTaskId === item.task.id}
                onExpand={setExpandedTaskId}
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
