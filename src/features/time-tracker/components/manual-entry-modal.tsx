import { useState } from 'react'

import { AnimatePresence, motion } from 'framer-motion'

import { cn, TASK_CATEGORIES } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { useCreateTimeEntry } from '../hooks/use-time-tracker-mutations'
import { Goal, Task } from '../utils/types'

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
                <Select
                  value={taskId || 'no_task'}
                  onValueChange={(value) => {
                    const id = value === 'no_task' ? '' : value
                    setTaskId(id)
                    const t = tasks.find((task) => task.id === id)
                    if (t) setTitle(t.title)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a task" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_task">Choose a task</SelectItem>
                    {tasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold uppercase">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold uppercase">Link to Goal (Optional)</label>
                <Select
                  value={goalId || 'no_goal'}
                  onValueChange={(value) => setGoalId(value === 'no_goal' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_goal">No Goal</SelectItem>
                    {goals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={onClose} className="btn-brutal-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={createEntry.isPending} className="btn-brutal-dark flex-1">
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
