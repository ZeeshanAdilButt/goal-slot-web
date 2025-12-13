import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn, TASK_CATEGORIES } from '@/lib/utils'
import { Goal, Task } from '../utils/types'
import { useCreateTimeEntry } from '../hooks/use-time-tracker-mutations'

interface ManualEntryModalProps {
  isOpen: boolean
  onClose: () => void
  goals: Goal[]
  tasks: Task[]
}

export function ManualEntryModal({ isOpen, onClose, goals, tasks }: ManualEntryModalProps) {
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState(30)
  const [category, setCategory] = useState('DEEP_WORK')
  const [goalId, setGoalId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState('09:00')
  const [taskId, setTaskId] = useState('')

  const createEntry = useCreateTimeEntry()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const startedAt = startTime ? new Date(`${date}T${startTime}:00`).toISOString() : undefined
    const taskTitle = taskId ? tasks.find((t) => t.id === taskId)?.title || title : title

    createEntry.mutate(
      {
        taskName: taskTitle,
        taskId: taskId || undefined,
        taskTitle,
        startedAt,
        duration,
        date,
        notes: `Manual entry`,
        goalId: goalId || undefined,
      },
      {
        onSuccess: () => {
          onClose()
          setTitle('')
          setDuration(30)
          setTaskId('')
        },
      },
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="modal-brutal relative z-10 w-full max-w-md"
          >
            <h2 className="mb-6 text-2xl font-bold uppercase">Manual Time Entry</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold uppercase">Select Task</label>
                <select
                  value={taskId}
                  onChange={(e) => {
                    const id = e.target.value
                    setTaskId(id)
                    const t = tasks.find((task) => task.id === id)
                    if (t) setTitle(t.title)
                  }}
                  className="input-brutal"
                >
                  <option value="">Choose a task</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold uppercase">Task Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What did you work on?"
                  className="input-brutal"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-bold uppercase">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="input-brutal"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold uppercase">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="input-brutal"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold uppercase">Duration (minutes)</label>
                <div className="flex gap-2">
                  {[15, 30, 45, 60, 90, 120].map((min) => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => setDuration(min)}
                      className={cn(
                        'flex-1 py-2 border-2 border-secondary font-mono text-sm transition-all',
                        duration === min ? 'bg-primary shadow-brutal-sm' : 'bg-white hover:bg-gray-100',
                      )}
                    >
                      {min}m
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                  min={1}
                  className="input-brutal mt-2"
                  placeholder="Custom duration"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold uppercase">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-brutal">
                  {TASK_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold uppercase">Link to Goal (Optional)</label>
                <select value={goalId} onChange={(e) => setGoalId(e.target.value)} className="input-brutal">
                  <option value="">No Goal</option>
                  {goals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={onClose} className="btn-brutal-secondary flex-1">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createEntry.isPending}
                  className="btn-brutal-dark flex-1"
                >
                  {createEntry.isPending ? 'Adding...' : 'Add Entry'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
