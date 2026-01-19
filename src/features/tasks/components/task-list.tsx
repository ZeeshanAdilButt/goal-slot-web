import { useMemo } from 'react'

import { GroupBy, Task } from '@/features/tasks/utils/types'
import { groupTasks } from '@/features/tasks/utils/utils'

import { cn } from '@/lib/utils'
import VirtualizedList from '@/components/virtualized-list'

import { TaskListItem } from './task-list-item/task-list-item'

interface TaskListProps {
  tasks: Task[]
  groupBy: GroupBy
  onComplete?: (task: Task) => void
  onEdit?: (task: Task) => void
}

export function TaskList({ tasks, groupBy, onComplete, onEdit }: TaskListProps) {
  const groupedTasks = useMemo(() => groupTasks(tasks, groupBy), [tasks, groupBy])
  const rows = useMemo(() => {
    return groupedTasks.flatMap(([group, groupTasks]) => {
      const sectionRows: Array<
        { type: 'header'; group: string; count: number } | { type: 'row'; group: string; tasks: Task[] }
      > = [{ type: 'header', group, count: groupTasks.length }]

      for (let i = 0; i < groupTasks.length; i += 2) {
        sectionRows.push({ type: 'row', group, tasks: groupTasks.slice(i, i + 2) })
      }

      return sectionRows
    })
  }, [groupedTasks])

  if (!tasks.length) {
    return (
      <div className="px-2 md:-ml-[3px] md:px-0">
        <div className="card-brutal p-2 text-center font-mono text-gray-600 sm:p-6">
          No tasks yet. Create one to link it to your schedule and goals.
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col px-2 md:-ml-[3px] md:px-0">
      <VirtualizedList
        items={rows}
        getItemKey={(row) =>
          row.type === 'header' ? `header-${row.group}` : `row-${row.group}-${row.tasks.map((t) => t.id).join('-')}`
        }
        estimateSize={220}
        className="min-h-0 flex-1"
        height="100%"
        renderItem={({ item }) =>
          item.type === 'header' ? (
            <div className="pb-3">
              <div className={cn('card-brutal p-3 sm:p-4', item.group === 'DONE' ? 'bg-gray-50 opacity-75' : '')}>
                <div className="flex items-center justify-between sm:mb-1">
                  <h3
                    className={cn(
                      'font-display text-sm sm:text-base font-bold uppercase',
                      item.group === 'DOING' ? 'text-accent-blue' : '',
                    )}
                  >
                    {item.group.replace('_', ' ')}
                  </h3>
                  <span
                    className={cn(
                      'badge-brutal text-[10px] sm:text-xs flex-shrink-0',
                      item.group === 'DOING' ? 'bg-accent-blue text-white' : '',
                    )}
                  >
                    {item.count}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="pb-3">
              <div className={cn('card-brutal p-3 sm:p-4', item.group === 'DONE' ? 'bg-gray-50 opacity-75' : '')}>
                <div className="grid gap-3 md:grid-cols-2">
                  {item.tasks.map((task) => (
                    <TaskListItem key={task.id} task={task} onComplete={onComplete} onEdit={onEdit} />
                  ))}
                </div>
              </div>
            </div>
          )
        }
      />
    </div>
  )
}
