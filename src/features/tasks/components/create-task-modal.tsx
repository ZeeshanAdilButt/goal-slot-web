import { TiptapEditor } from '@/components/tiptap-editor/tiptap-editor'
import { useEffect, useState } from 'react'

import { CreateTaskForm, Goal, ScheduleBlock, Task } from '@/features/tasks/utils/types'

import { getLocalDateString } from '@/lib/utils'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (form: CreateTaskForm) => Promise<boolean>
  scheduleBlocks: ScheduleBlock[]
  goals: Goal[]
  task?: Task | null
  defaultGoalId?: string
}

const STATUS_OPTIONS = [
  { value: 'BACKLOG', label: 'Backlog' },
  { value: 'TODO', label: 'To Do' },
  { value: 'DOING', label: 'Doing' },
  { value: 'DONE', label: 'Done' },
]
const NO_GOAL_VALUE = 'none'

export function CreateTaskModal({
  isOpen,
  onClose,
  onSubmit,
  scheduleBlocks,
  goals,
  task,
  defaultGoalId,
}: CreateTaskModalProps) {
  const [creating, setCreating] = useState(false)
  const [estimatedHours, setEstimatedHours] = useState('')
  const [status, setStatus] = useState('BACKLOG')
  
  const [form, setForm] = useState<CreateTaskForm>({
    title: '',
    description: '',
    category: '',
    estimatedMinutes: '',
    goalId: '',
    scheduleBlockId: '',
    dueDate: '',
  })

  useEffect(() => {
    if (task && isOpen) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        category: task.category || '',
        estimatedMinutes: task.estimatedMinutes?.toString() || '',
        goalId: task.goalId || '',
        scheduleBlockId: task.scheduleBlockId || '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      })
      setStatus(task.status || 'BACKLOG')
      
      // Calculate hours from minutes (e.g. 90 mins -> 1.5 hours)
      if (task.estimatedMinutes) {
        setEstimatedHours((task.estimatedMinutes / 60).toString())
      } else {
        setEstimatedHours('')
      }
    } else if (!task && isOpen) {
      const initialForm: CreateTaskForm = {
        title: '',
        description: '',
        category: '',
        estimatedMinutes: '',
        goalId: defaultGoalId || '',
        scheduleBlockId: '',
        dueDate: '',
      }

      setEstimatedHours('')
      setStatus('BACKLOG')

      // Pre-fill from default goal
      if (defaultGoalId) {
        const selectedGoal = goals.find((g) => g.id === defaultGoalId)
        if (selectedGoal) {
          if (selectedGoal.category) {
            initialForm.category = selectedGoal.category
          }

          const todayDate = getLocalDateString()
          initialForm.dueDate = todayDate
        }
      }

      setForm(initialForm)
    }
  }, [task, isOpen, defaultGoalId, goals, scheduleBlocks])

  const handleSubmit = async () => {
    if (!form.title.trim()) return
    setCreating(true)
    
    // Convert hours back to minutes for submission if valid (e.g. 1.5 -> 90)
    let finalForm = { ...form, status }
    if (estimatedHours && !isNaN(parseFloat(estimatedHours))) {
      finalForm.estimatedMinutes = Math.round(parseFloat(estimatedHours) * 60).toString()
    } else {
       finalForm.estimatedMinutes = ''
    }

    const success = await onSubmit(finalForm)
    setCreating(false)
    if (success) {
      setForm({
        title: '',
        description: '',
        category: '',
        estimatedMinutes: '',
        goalId: '',
        scheduleBlockId: '',
        dueDate: '',
      })
      setEstimatedHours('')
      setStatus('BACKLOG')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="modal-brutal max-h-[90vh] w-[90vw] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold uppercase">{task ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="font-mono text-sm uppercase">Title</label>
            <input
              className="input-brutal mt-1 w-full"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          {/* Options row above description */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="font-mono text-sm uppercase">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="input-brutal mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-mono text-sm uppercase">Est. Hours</label>
              <input
                type="number"
                min={0}
                step={0.1}
                className="input-brutal mt-1 w-full"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="e.g. 1.5"
              />
            </div>
            <div>
              <label className="font-mono text-sm uppercase">Due Date</label>
              <input
                type="date"
                className="input-brutal mt-1 w-full"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div>
              <label className="font-mono text-sm uppercase">Goal</label>
              <Select
                value={form.goalId || NO_GOAL_VALUE}
                onValueChange={(value) => setForm({ ...form, goalId: value === NO_GOAL_VALUE ? '' : value })}
              >
                <SelectTrigger className="input-brutal mt-1 w-full">
                  <SelectValue placeholder="Select a goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_GOAL_VALUE}>No Goal</SelectItem>
                  {goals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description with resizable textarea */}
          <div>
            <label className="font-mono text-sm uppercase">Description</label>
            <div className="mt-1 w-full rounded-none border-3 border-secondary bg-white">
              <TiptapEditor
                content={form.description}
                onChange={(html) => setForm({ ...form, description: html })}
                placeholder="Details of the task..."
                className="max-h-[600px] min-h-[350px] resize-y overflow-y-auto border-none shadow-none"
              />
            </div>
            <p className="mt-1 text-[10px] uppercase text-gray-500">Drag bottom-right corner to resize</p>
          </div>
        </div>
        <DialogFooter className="flex-row gap-3 pt-4">
          <button className="btn-brutal-secondary flex-1" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-brutal flex-1" onClick={handleSubmit} disabled={creating}>
            {creating ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
