import { Task } from '../utils/types'

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
        <select
          value={currentTaskId}
          onChange={(e) => onTaskIdChange(e.target.value)}
          disabled={timerState !== 'STOPPED'}
          className="w-full border-3 border-white/30 bg-white/10 px-4 py-3 text-lg font-bold text-white focus:border-primary focus:outline-none disabled:opacity-50"
        >
          <option value="" className="text-secondary">
            Select a task
          </option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id} className="text-secondary">
              {task.title}
            </option>
          ))}
        </select>
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
