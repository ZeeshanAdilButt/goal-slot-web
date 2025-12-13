import { Task } from '@/features/time-tracker/utils/types'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TaskSelectorProps {
  tasks: Task[]
  currentTaskId: string
  currentTask: string
  timerState: 'STOPPED' | 'RUNNING' | 'PAUSED'
  onTaskIdChange: (id: string) => void
  onTaskTitleChange: (title: string) => void
}

export function TaskSelector({
  tasks,
  currentTaskId,
  currentTask,
  timerState,
  onTaskIdChange,
  onTaskTitleChange,
}: TaskSelectorProps) {
  return (
    <div className="mb-6 space-y-3">
      <div>
        <label className="mb-2 block text-sm font-bold uppercase opacity-75">Select Task</label>
        <Select
          value={currentTaskId || 'unselected'}
          onValueChange={(val) => onTaskIdChange(val === 'unselected' ? '' : val)}
          disabled={timerState !== 'STOPPED'}
        >
          <SelectTrigger className="h-auto w-full border-3 border-white/30 bg-white/10 px-4 py-3 text-lg font-bold text-white shadow-none hover:border-white/50 hover:bg-white/20 hover:text-white hover:shadow-none focus:border-primary focus:ring-0 disabled:opacity-50 data-[state=open]:bg-white/20 data-[state=open]:text-white">
            <SelectValue placeholder="Select a task" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unselected">Select a task</SelectItem>
            {tasks.map((task) => (
              <SelectItem key={task.id} value={task.id}>
                {task.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-bold uppercase opacity-75">Or enter a custom title</label>
        <input
          type="text"
          value={currentTask}
          onChange={(e) => onTaskTitleChange(e.target.value)}
          placeholder="What are you working on?"
          disabled={timerState !== 'STOPPED'}
          className="w-full border-3 border-white/30 bg-white/10 px-4 py-2 text-white placeholder-white/50 focus:border-primary focus:outline-none disabled:opacity-50"
        />
      </div>
    </div>
  )
}
