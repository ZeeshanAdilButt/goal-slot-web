import { useState } from 'react'

import { useDeleteGoalMutation } from '@/features/goals/hooks/use-goals-mutations'
import { Goal } from '@/features/goals/utils/types'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { Edit2, Lock, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { HtmlContent } from '@/components/html-content'

interface GoalItemProps {
  goal: Goal
  index: number
  onEdit: (goal: Goal) => void
  isLocked?: boolean
}

export function GoalItem({ goal, index, onEdit, isLocked = false }: GoalItemProps) {
  const canEdit = !isLocked
  const deleteMutation = useDeleteGoalMutation()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    deleteMutation.mutate(goal.id)
  }

  const progress = goal.targetHours > 0 ? Math.min(100, Math.round((goal.loggedHours / goal.targetHours) * 100)) : 0

  const statusVariant =
    isLocked
      ? 'warning'
      : goal.status === 'ACTIVE'
        ? 'success'
        : goal.status === 'COMPLETED'
          ? 'default'
          : 'default'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <GlassCard
        className={cn('relative flex flex-col border-l-4', isLocked && 'opacity-60')}
        style={{ borderLeftColor: goal.color }}
      >
        {/* Locked overlay indicator */}
        {isLocked && (
          <div className="absolute -right-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 shadow-sm">
            <Lock className="h-3.5 w-3.5 text-zinc-900" />
          </div>
        )}

        {/* Header row: Status + Actions */}
        <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-2">
          <Badge variant={statusVariant as 'success' | 'warning' | 'default'}>
            {isLocked ? 'LOCKED' : goal.status}
          </Badge>

          {/* Actions */}
          <div className="flex shrink-0 gap-1.5">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-8 w-8"
              onClick={() => canEdit && onEdit(goal)}
              disabled={!canEdit}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-8 w-8 text-rose-600 hover:bg-rose-50 hover:border-rose-200"
              onClick={() => canEdit && handleDelete()}
              disabled={!canEdit}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Title & Category */}
        <h3 className="mt-3 text-base font-semibold text-zinc-900 leading-tight">{goal.title}</h3>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mt-1">{goal.category}</span>

        {/* Labels */}
        {goal.labels && goal.labels.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {goal.labels.map((gl) => (
              <span
                key={gl.label.id}
                className="rounded-full border border-zinc-200 px-2 py-0.5 text-[10px] font-medium"
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
        {goal.description && (
          <HtmlContent
            html={goal.description}
            className="prose prose-sm mt-2 max-w-none text-sm text-zinc-600"
          />
        )}

        {/* Progress */}
        <div className="mt-4 flex items-center gap-3 text-xs">
          <span className="font-semibold text-zinc-900 tabular-nums">{goal.loggedHours.toFixed(1)}h logged</span>
          <span className="text-zinc-500 tabular-nums">{goal.targetHours}h target</span>
        </div>

        <div className="mt-2 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#f2cc0d] transition-all" style={{ width: `${progress}%` }} />
        </div>

        {/* Deadline */}
        {goal.deadline && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Deadline</span>
            <Badge variant="default">{format(new Date(goal.deadline), 'MMM d, yyyy')}</Badge>
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
      </GlassCard>
    </motion.div>
  )
}
