'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Target, Edit2, Trash2, X, Calendar,
  CheckCircle, PauseCircle, Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { goalsApi } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { cn, GOAL_CATEGORIES, COLOR_OPTIONS, getCategoryColor, getProgressColor } from '@/lib/utils'
import { useHasProAccess } from '@/lib/store'

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
    active: goals.filter(g => g.status === 'ACTIVE').length,
    completed: goals.filter(g => g.status === 'COMPLETED').length,
    paused: goals.filter(g => g.status === 'PAUSED').length,
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold uppercase">Goals</h1>
          <p className="font-mono text-gray-600 uppercase">Track your objectives and targets</p>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="btn-brutal flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
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
          <div 
            key={stat.label}
            className={`${stat.color} border-3 border-secondary shadow-brutal p-6 text-center`}
          >
            <div className="text-4xl font-bold font-mono">{stat.value}</div>
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
              filter === status 
                ? 'bg-secondary text-white' 
                : 'bg-white hover:bg-gray-100'
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
            <div key={i} className="h-48 bg-gray-200 animate-pulse" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="card-brutal text-center py-16">
          <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="font-bold uppercase text-xl mb-2">No {filter.toLowerCase()} Goals</h3>
          <p className="font-mono text-gray-600 mb-6">
            {filter === 'ACTIVE' 
              ? "Create your first goal to start tracking your progress"
              : `No ${filter.toLowerCase()} goals yet`}
          </p>
          {filter === 'ACTIVE' && (
            <button onClick={() => setShowModal(true)} className="btn-brutal">
              <Plus className="w-4 h-4 mr-2 inline" />
              Create Goal
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {goals.map((goal, i) => {
            const progress = goal.targetHours > 0 
              ? Math.min(100, Math.round((goal.loggedHours / goal.targetHours) * 100))
              : 0

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
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => handleEdit(goal)}
                    className="w-8 h-8 bg-white border-2 border-secondary flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="w-8 h-8 bg-white border-2 border-secondary flex items-center justify-center hover:bg-red-100 transition-colors text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Status Badge */}
                <span className={cn(
                  'badge-brutal text-xs',
                  goal.status === 'ACTIVE' ? 'bg-accent-green text-white' :
                  goal.status === 'COMPLETED' ? 'bg-accent-blue text-white' :
                  'bg-gray-300'
                )}>
                  {goal.status}
                </span>

                {/* Title & Category */}
                <h3 className="font-bold uppercase text-lg mt-3">{goal.title}</h3>
                <span className="font-mono text-sm text-gray-600 uppercase">{goal.category}</span>

                {/* Description */}
                {goal.description && (
                  <p className="font-mono text-sm mt-2 text-gray-700">{goal.description}</p>
                )}

                {/* Progress */}
                <div className="mt-4 flex items-center gap-3">
                  <span className="font-mono text-sm font-bold">
                    {goal.loggedHours.toFixed(1)}h logged
                  </span>
                  <span className="font-mono text-sm text-gray-500">
                    {goal.targetHours}h target
                  </span>
                </div>

                <div className="mt-2 progress-brutal">
                  <div 
                    className={`progress-brutal-fill ${getProgressColor(progress)}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Deadline */}
                {goal.deadline && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="font-bold text-xs uppercase">Deadline:</span>
                    <span className="badge-brutal bg-secondary text-white text-xs">
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
      <GoalModal 
        isOpen={showModal}
        onClose={handleCloseModal}
        onSuccess={loadGoals}
        goal={editingGoal}
      />
    </div>
  )
}

// Goal Modal Component
function GoalModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  goal 
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
            className="modal-brutal w-full max-w-lg relative z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold uppercase">
                {goal ? 'Edit Goal' : 'New Goal'}
              </h2>
              <button
                onClick={onClose}
                className="w-10 h-10 border-3 border-secondary flex items-center justify-center hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block font-bold uppercase text-sm mb-2">Goal Title</label>
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
                <label className="block font-bold uppercase text-sm mb-2">Description</label>
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
                  <label className="block font-bold uppercase text-sm mb-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-brutal"
                  >
                    {GOAL_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {goal && (
                  <div>
                    <label className="block font-bold uppercase text-sm mb-2">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="input-brutal"
                    >
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
                  <label className="block font-bold uppercase text-sm mb-2">Target Hours</label>
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
                  <label className="block font-bold uppercase text-sm mb-2">Deadline</label>
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
                <label className="block font-bold uppercase text-sm mb-2">Color</label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={cn(
                        'w-10 h-10 border-3 border-secondary transition-transform',
                        color === c && 'scale-110 shadow-brutal-sm'
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 btn-brutal-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 btn-brutal-dark"
                >
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
