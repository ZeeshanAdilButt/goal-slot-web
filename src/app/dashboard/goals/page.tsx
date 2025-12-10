'use client'

/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'

import { format } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import { Calendar, CheckCircle, Clock, Edit2, PauseCircle, Plus, Target, Trash2, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { goalsApi } from '@/lib/api'
import { useHasProAccess } from '@/lib/store'
import { cn, COLOR_OPTIONS, getCategoryColor, getProgressColor, GOAL_CATEGORIES } from '@/lib/utils'

interface Goal {
  id: string
  title: string
  description?: string
  category: string
  targetHours: number
  loggedHours: number
  deadline?: string
  status: string
  color: string
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [filter, setFilter] = useState<string>('ACTIVE')
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const hasProAccess = useHasProAccess()

  useEffect(() => {
    loadGoals()
  }, [filter])

  const loadGoals = async () => {
    try {
      const { data } = await goalsApi.getAll(filter)
      setGoals(data)
    } catch (error) {
      toast.error('Failed to load goals')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return

    try {
      await goalsApi.delete(id)
      toast.success('Goal deleted')
      loadGoals()
    } catch (error) {
      toast.error('Failed to delete goal')
    }
  }

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingGoal(null)
  }

  const stats = {
    active: goals.filter((g) => g.status === 'ACTIVE').length,
    completed: goals.filter((g) => g.status === 'COMPLETED').length,
    paused: goals.filter((g) => g.status === 'PAUSED').length,
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold uppercase">Goals</h1>
          <p className="font-mono uppercase text-gray-600">Track your objectives and targets</p>
        </div>

        <button onClick={() => setShowModal(true)} className="btn-brutal flex items-center gap-2">
          <Plus className="h-5 w-5" />
          New Goal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6">
        {[
          { label: 'Active', value: stats.active, color: 'bg-accent-green' },
          { label: 'Completed', value: stats.completed, color: 'bg-accent-blue' },
          { label: 'Paused', value: stats.paused, color: 'bg-primary' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} border-3 border-secondary p-6 text-center shadow-brutal`}>
            <div className="font-mono text-4xl font-bold">{stat.value}</div>
            <div className="font-bold uppercase">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['ACTIVE', 'COMPLETED', 'PAUSED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              'px-4 py-2 font-bold uppercase text-sm border-3 border-secondary transition-all',
              filter === status ? 'bg-secondary text-white' : 'bg-white hover:bg-gray-100',
            )}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse bg-gray-200" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="card-brutal py-16 text-center">
          <Target className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <h3 className="mb-2 text-xl font-bold uppercase">No {filter.toLowerCase()} Goals</h3>
          <p className="mb-6 font-mono text-gray-600">
            {filter === 'ACTIVE'
              ? 'Create your first goal to start tracking your progress'
              : `No ${filter.toLowerCase()} goals yet`}
          </p>
          {filter === 'ACTIVE' && (
            <button onClick={() => setShowModal(true)} className="btn-brutal">
              <Plus className="mr-2 inline h-4 w-4" />
              Create Goal
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {goals.map((goal, i) => {
            const progress =
              goal.targetHours > 0 ? Math.min(100, Math.round((goal.loggedHours / goal.targetHours) * 100)) : 0

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card-brutal-colored relative"
                style={{ backgroundColor: goal.color + '40', borderLeftColor: goal.color, borderLeftWidth: '8px' }}
              >
                {/* Actions */}
                <div className="absolute right-4 top-4 flex gap-2">
                  <button
                    onClick={() => handleEdit(goal)}
                    className="flex h-8 w-8 items-center justify-center border-2 border-secondary bg-white transition-colors hover:bg-gray-100"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="flex h-8 w-8 items-center justify-center border-2 border-secondary bg-white text-red-500 transition-colors hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Status Badge */}
                <span
                  className={cn(
                    'badge-brutal text-xs',
                    goal.status === 'ACTIVE'
                      ? 'bg-accent-green text-white'
                      : goal.status === 'COMPLETED'
                        ? 'bg-accent-blue text-white'
                        : 'bg-gray-300',
                  )}
                >
                  {goal.status}
                </span>

                {/* Title & Category */}
                <h3 className="mt-3 text-lg font-bold uppercase">{goal.title}</h3>
                <span className="font-mono text-sm uppercase text-gray-600">{goal.category}</span>

                {/* Description */}
                {goal.description && <p className="mt-2 font-mono text-sm text-gray-700">{goal.description}</p>}

                {/* Progress */}
                <div className="mt-4 flex items-center gap-3">
                  <span className="font-mono text-sm font-bold">{goal.loggedHours.toFixed(1)}h logged</span>
                  <span className="font-mono text-sm text-gray-500">{goal.targetHours}h target</span>
                </div>

                <div className="progress-brutal mt-2">
                  <div
                    className={`progress-brutal-fill ${getProgressColor(progress)}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Deadline */}
                {goal.deadline && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs font-bold uppercase">Deadline:</span>
                    <span className="badge-brutal bg-secondary text-xs text-white">
                      {format(new Date(goal.deadline), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Free Plan Limit Notice */}
      {!hasProAccess && stats.active >= 3 && (
        <div className="card-brutal-colored bg-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold uppercase">You've reached your free plan limit</p>
              <p className="font-mono text-sm">Upgrade to Pro for unlimited goals</p>
            </div>
            <a href="/dashboard/settings#billing" className="btn-brutal-dark">
              Upgrade to Pro
            </a>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <GoalModal isOpen={showModal} onClose={handleCloseModal} onSuccess={loadGoals} goal={editingGoal} />
    </div>
  )
}

// Goal Modal Component
function GoalModal({
  isOpen,
  onClose,
  onSuccess,
  goal,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  goal: Goal | null
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('LEARNING')
  const [targetHours, setTargetHours] = useState('')
  const [deadline, setDeadline] = useState('')
  const [color, setColor] = useState(COLOR_OPTIONS[0])
  const [status, setStatus] = useState('ACTIVE')
  const [isLoading, setIsLoading] = useState(false)

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

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setCategory('LEARNING')
    setTargetHours('')
    setDeadline('')
    setColor(COLOR_OPTIONS[0])
    setStatus('ACTIVE')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const baseData = {
        title,
        description,
        category,
        targetHours: parseFloat(targetHours),
        deadline: deadline || undefined,
        color,
      }

      if (goal) {
        // Include status only when updating
        await goalsApi.update(goal.id, { ...baseData, status })
        toast.success('Goal updated')
      } else {
        // Don't include status when creating
        await goalsApi.create(baseData)
        toast.success('Goal created')
      }

      onSuccess()
      onClose()
      resetForm()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save goal')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="modal-brutal relative z-10 w-full max-w-lg"
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold uppercase">{goal ? 'Edit Goal' : 'New Goal'}</h2>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center border-3 border-secondary hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="mb-2 block text-sm font-bold uppercase">Goal Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter goal title"
                  className="input-brutal"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-bold uppercase">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your goal..."
                  className="input-brutal min-h-[100px] resize-none"
                  rows={3}
                />
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-bold uppercase">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-brutal">
                    {GOAL_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {goal && (
                  <div>
                    <label className="mb-2 block text-sm font-bold uppercase">Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-brutal">
                      <option value="ACTIVE">Active</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="PAUSED">Paused</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Target Hours & Deadline */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-bold uppercase">Target Hours</label>
                  <input
                    type="number"
                    value={targetHours}
                    onChange={(e) => setTargetHours(e.target.value)}
                    placeholder="e.g. 20"
                    className="input-brutal"
                    required
                    min="1"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold uppercase">Deadline</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="input-brutal"
                  />
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="mb-2 block text-sm font-bold uppercase">Color</label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={cn(
                        'w-10 h-10 border-3 border-secondary transition-transform',
                        color === c && 'scale-110 shadow-brutal-sm',
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={onClose} className="btn-brutal-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={isLoading} className="btn-brutal-dark flex-1">
                  {isLoading ? 'Saving...' : goal ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
