import { useEffect, useState } from 'react'

import { useCreateGoalMutation, useUpdateGoalMutation } from '@/features/goals/hooks/use-goals-mutations'
import { CreateGoalForm, Goal, GoalStatus } from '@/features/goals/utils/types'
import { Calendar, Clock } from 'lucide-react'

import { COLOR_OPTIONS, GOAL_CATEGORIES } from '@/lib/utils'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface GoalModalProps {
  isOpen: boolean
  onClose: () => void
  goal: Goal | null
}

export function GoalModal({ isOpen, onClose, goal }: GoalModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('LEARNING')
  const [targetHours, setTargetHours] = useState('')
  const [deadline, setDeadline] = useState('')
  const [color, setColor] = useState(COLOR_OPTIONS[0])
  const [status, setStatus] = useState<GoalStatus>('ACTIVE')

  const createMutation = useCreateGoalMutation()
  const updateMutation = useUpdateGoalMutation()

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setCategory('LEARNING')
    setTargetHours('')
    setDeadline('')
    setColor(COLOR_OPTIONS[0])
    setStatus('ACTIVE')
  }

  useEffect(() => {
    if (goal) {
      setTitle(goal.title)
      setDescription(goal.description || '')
      setCategory(goal.category)
      setTargetHours(goal.targetHours.toString())
      setDeadline(goal.deadline ? goal.deadline.split('T')[0] : '')
      setColor(goal.color)
      setStatus(goal.status)
    } else {
      resetForm()
    }
  }, [goal])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const data: CreateGoalForm = {
      title,
      description,
      category,
      targetHours: parseFloat(targetHours),
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      color,
      status,
    }

    if (goal) {
      updateMutation.mutate({ id: goal.id, data }, { onSuccess: onClose })
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          resetForm()
          onClose()
        },
      })
    }
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-brutal w-full"
              placeholder="e.g., Learn Rust"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-bold uppercase">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-brutal w-full"
              rows={3}
              placeholder="What do you want to achieve?"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Category */}
            <div>
              <label className="mb-2 block text-sm font-bold uppercase">Category</label>
              <Select value={category} onValueChange={setCategory}>
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

            {/* Status */}
            <div>
              <label className="mb-2 block text-sm font-bold uppercase">Status</label>
              <Select value={status} onValueChange={(value) => setStatus(value as GoalStatus)}>
                <SelectTrigger className="input-brutal w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Target Hours */}
            <div>
              <label className="mb-2 block text-sm font-bold uppercase">Target Hours</label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  value={targetHours}
                  onChange={(e) => setTargetHours(e.target.value)}
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
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
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
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border-2 border-black transition-transform hover:scale-110 ${
                    color === c ? 'ring-2 ring-black ring-offset-2' : ''
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
