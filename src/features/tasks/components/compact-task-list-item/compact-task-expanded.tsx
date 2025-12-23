import { TaskMetadata } from '@/features/tasks/components/task-list-item/task-metadata'
import { TaskProgress } from '@/features/tasks/components/task-list-item/task-progress'
import { Task } from '@/features/tasks/utils/types'

interface CompactTaskExpandedProps {
  task: Task
}

export function CompactTaskExpanded({ task }: CompactTaskExpandedProps) {
  return (
    <div className="space-y-3 border-t-3 border-secondary p-3 sm:p-4">
      {/* Task Description */}
      {task.description && (
        <p className="max-w-full break-words text-xs text-gray-700 sm:max-w-[62ch] sm:text-sm">{task.description}</p>
      )}

      {/* Task Metadata */}
      <TaskMetadata task={task} />

      {/* Task Progress */}
      <div className="space-y-2 border-t border-dashed border-secondary/20 pt-3">
        <TaskProgress task={task} />
      </div>
    </div>
  )
}
