import { useEffect, useState } from 'react'

import { useCategoriesQuery } from '@/features/categories'
import { CreateTaskForm, Goal, ScheduleBlock, Task } from '@/features/tasks/utils/types'

import { DAYS_OF_WEEK_FULL } from '@/lib/utils'
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
  const { data: categories = [] } = useCategoriesQuery()
  //Status is set automatically by the backend to 'pending'
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

      // Pre-fill from default goal
      if (defaultGoalId) {
        const selectedGoal = goals.find((g) => g.id === defaultGoalId)
        if (selectedGoal) {
          if (selectedGoal.category) {
            initialForm.category = selectedGoal.category
          }
          const goalBlock = scheduleBlocks.find((sb) => sb.goalId === defaultGoalId)
          if (goalBlock) {
            initialForm.scheduleBlockId = goalBlock.id
          }
        }
      }

      setForm(initialForm)
    }
  }, [task, isOpen, defaultGoalId, goals, scheduleBlocks])

  const handleSubmit = async () => {
    if (!form.title.trim()) return
    setCreating(true)
    const success = await onSubmit(form)
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
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="modal-brutal max-w-xl">
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
          <div>
            <label className="font-mono text-sm uppercase">Description</label>
            <textarea
              className="input-brutal mt-1 w-full"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <label className="font-mono text-sm uppercase">Category</label>
            <Select
              value={form.category || 'none'}
              onValueChange={(value) => setForm({ ...form, category: value === 'none' ? '' : value })}
            >
              <SelectTrigger className="input-brutal mt-1 w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select category</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="font-mono text-sm uppercase">Schedule Block</label>
              <Select
                value={form.scheduleBlockId || 'none'}
                onValueChange={(value) => setForm({ ...form, scheduleBlockId: value === 'none' ? '' : value })}
              >
                <SelectTrigger className="input-brutal mt-1 w-full">
                  <SelectValue placeholder="No schedule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No schedule</SelectItem>
                  {scheduleBlocks.map((block) => (
                    <SelectItem key={block.id} value={block.id}>
                      {DAYS_OF_WEEK_FULL[block.dayOfWeek]} • {block.startTime}-{block.endTime} • {block.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-mono text-sm uppercase">Goal</label>
              <Select
                value={form.goalId || 'none'}
                onValueChange={(value) => {
                  const goalId = value === 'none' ? '' : value
                  const newForm = { ...form, goalId }

                  // Auto-select category and schedule from goal
                  if (goalId) {
                    const selectedGoal = goals.find((g) => g.id === goalId)
                    if (selectedGoal) {
                      if (selectedGoal.category) {
                        newForm.category = selectedGoal.category
                      }
                      // Find first schedule block associated with this goal
                      const goalBlock = scheduleBlocks.find((sb) => sb.goalId === goalId)
                      if (goalBlock) {
                        newForm.scheduleBlockId = goalBlock.id
                      }
                    }
                  }

                  setForm(newForm)
                }}
              >
                <SelectTrigger className="input-brutal mt-1 w-full">
                  <SelectValue placeholder="No goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No goal</SelectItem>
                  {goals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="font-mono text-sm uppercase">Est. Minutes</label>
              <input
                type="number"
                min={1}
                className="input-brutal mt-1 w-full"
                value={form.estimatedMinutes}
                onChange={(e) => setForm({ ...form, estimatedMinutes: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="font-mono text-sm uppercase">Due Date</label>
              <input
                type="date"
                className="input-brutal mt-1 w-full"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
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
