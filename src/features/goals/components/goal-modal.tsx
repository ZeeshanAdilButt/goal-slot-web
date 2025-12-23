import { useEffect, useState } from 'react'

import { useCreateGoalMutation, useUpdateGoalMutation } from '@/features/goals/hooks/use-goals-mutations'
import { CreateGoalForm, Goal, GOAL_STATUS_OPTIONS, GoalFormState, GoalStatus } from '@/features/goals/utils/types'
import { Calendar, Clock } from 'lucide-react'

import { COLOR_OPTIONS, GOAL_CATEGORIES } from '@/lib/utils'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface GoalModalProps {
  isOpen: boolean
  onClose: () => void
  goal: Goal | null
}

const getInitialFormState = (): GoalFormState => ({
  title: '',
  description: '',
  category: 'LEARNING',
  targetHours: '',
  deadline: '',
  color: COLOR_OPTIONS[0],
  status: 'ACTIVE',
})

const formStateToApiData = (form: GoalFormState): CreateGoalForm => ({
  title: form.title,
  description: form.description,
  category: form.category,
  targetHours: parseFloat(form.targetHours),
  deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
  color: form.color,
})

export function GoalModal({ isOpen, onClose, goal }: GoalModalProps) {
  const [form, setForm] = useState<GoalFormState>(getInitialFormState)
  const createMutation = useCreateGoalMutation()
  const updateMutation = useUpdateGoalMutation()

  useEffect(() => {
    if (goal) {
      setForm({
        title: goal.title,
        description: goal.description || '',
        category: goal.category,
        targetHours: goal.targetHours.toString(),
        deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
        color: goal.color,
        status: goal.status,
      })
    } else {
      setForm(getInitialFormState())
    }
  }, [goal])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const apiData = formStateToApiData(form)

    if (goal) {
      updateMutation.mutate({ id: goal.id, data: { ...apiData, status: form.status } }, { onSuccess: onClose })
    } else {
      createMutation.mutate(apiData, {
        onSuccess: () => {
          setForm(getInitialFormState())
          onClose()
        },
      })
    }
  }

  const updateField = <K extends keyof GoalFormState>(field: K, value: GoalFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="modal-brutal">
        <DialogHeader className="mb-2 flex-row items-center justify-between">
          <DialogTitle className="text-2xl font-bold uppercase">{goal ? 'Edit Goal' : 'New Goal'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="mb-2 block text-sm font-bold uppercase">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="input-brutal w-full"
              placeholder="e.g., Learn Rust"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-bold uppercase">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="input-brutal w-full"
              rows={3}
              placeholder="What do you want to achieve?"
            />
          </div>

          {/* Category and Status */}
          <div className={goal ? 'grid grid-cols-2 gap-6' : ''}>
            {/* Category */}
            <div>
              <label className="mb-2 block text-sm font-bold uppercase">Category</label>
              <Select value={form.category} onValueChange={(value) => updateField('category', value)}>
                <SelectTrigger className="input-brutal w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status - Only show when editing */}
            {goal && (
              <div>
                <label className="mb-2 block text-sm font-bold uppercase">Status</label>
                <Select value={form.status} onValueChange={(value) => updateField('status', value as GoalStatus)}>
                  <SelectTrigger className="input-brutal w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Target Hours and Deadline */}
          <div className="grid grid-cols-2 gap-6">
            {/* Target Hours */}
            <div>
              <label className="mb-2 block text-sm font-bold uppercase">Target Hours</label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  value={form.targetHours}
                  onChange={(e) => updateField('targetHours', e.target.value)}
                  className="input-brutal w-full pl-10"
                  placeholder="100"
                  min="1"
                  required
                />
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="mb-2 block text-sm font-bold uppercase">Deadline</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => updateField('deadline', e.target.value)}
                  className="input-brutal w-full pl-10"
                />
              </div>
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="mb-2 block text-sm font-bold uppercase">Color</label>
            <div className="flex gap-3">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => updateField('color', c)}
                  className={`h-8 w-8 rounded-full border-2 border-black transition-transform hover:scale-110 ${
                    form.color === c ? 'ring-2 ring-black ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="flex-row gap-4 pt-4">
            <button type="button" onClick={onClose} className="btn-brutal-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn-brutal-dark flex-1"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : goal
                  ? 'Update Goal'
                  : 'Create Goal'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
