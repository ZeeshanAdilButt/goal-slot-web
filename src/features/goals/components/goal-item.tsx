import { useState } from 'react'

import { useDeleteGoalMutation } from '@/features/goals/hooks/use-goals-mutations'
import { Goal } from '@/features/goals/utils/types'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { Edit2, Trash2 } from 'lucide-react'

import { cn, getProgressColor } from '@/lib/utils'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface GoalItemProps {
  goal: Goal
  index: number
  onEdit: (goal: Goal) => void
}

export function GoalItem({ goal, index, onEdit }: GoalItemProps) {
  const deleteMutation = useDeleteGoalMutation()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    deleteMutation.mutate(goal.id)
  }

  const progress = goal.targetHours > 0 ? Math.min(100, Math.round((goal.loggedHours / goal.targetHours) * 100)) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card-brutal-colored relative flex flex-col"
      style={{ backgroundColor: goal.color + '40', borderLeftColor: goal.color, borderLeftWidth: '8px' }}
    >
      {/* Header row: Status + Actions */}
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            'badge-brutal text-xs shrink-0',
            goal.status === 'ACTIVE'
              ? 'bg-accent-green text-white'
              : goal.status === 'COMPLETED'
                ? 'bg-accent-blue text-white'
                : 'bg-gray-300',
          )}
        >
          {goal.status}
        </span>

        {/* Actions */}
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => onEdit(goal)}
            className="flex h-8 w-8 items-center justify-center border-2 border-secondary bg-white transition-colors hover:bg-gray-100"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            className="flex h-8 w-8 items-center justify-center border-2 border-secondary bg-white text-red-500 transition-colors hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Title & Category */}
      <h3 className="mt-3 text-lg font-bold uppercase leading-tight">{goal.title}</h3>
      <span className="font-mono text-sm uppercase text-gray-600">{goal.category}</span>

      {/* Labels */}
      {goal.labels && goal.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {goal.labels.map((gl) => (
            <span
              key={gl.label.id}
              className="rounded-full border border-black/20 px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: gl.label.color || '#e5e7eb',
                color: '#000',
              }}
            >
              {gl.label.name}
            </span>
          ))}
        </div>
      )}

      {/* Description */}
      {goal.description && <p className="mt-2 font-mono text-sm text-gray-700">{goal.description}</p>}

      {/* Progress */}
      <div className="mt-4 flex items-center gap-3">
        <span className="font-mono text-sm font-bold">{goal.loggedHours.toFixed(1)}h logged</span>
        <span className="font-mono text-sm text-gray-500">{goal.targetHours}h target</span>
      </div>

      <div className="progress-brutal mt-2">
        <div className={`progress-brutal-fill ${getProgressColor(progress)}`} style={{ width: `${progress}%` }} />
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Goal"
        description="Are you sure you want to delete this goal? This action cannot be undone."
        onConfirm={confirmDelete}
        confirmButtonText="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </motion.div>
  )
}
