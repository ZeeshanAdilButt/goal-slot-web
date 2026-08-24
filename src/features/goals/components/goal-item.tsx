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

  const statusVariant = isLocked
    ? 'warning'
    : goal.status === 'ACTIVE'
      ? 'success'
      : goal.status === 'COMPLETED'
        ? 'default'
        : 'default'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className="group h-full"
    >
      <GlassCard
        className={cn('relative flex h-full flex-col gap-3 border-l-[5px] p-4', isLocked && 'opacity-60')}
        style={{ borderLeftColor: goal.color }}
      >
        {isLocked && (
          <div className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 shadow-sm">
            <Lock className="h-3 w-3 text-zinc-900" />
          </div>
        )}

        {/* Title row: category eyebrow + title + actions on hover */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className={cn('h-1.5 w-1.5 rounded-full', goal.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-zinc-300')}
              />
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                {goal.category}
              </span>
              {isLocked && (
                <Badge variant="warning" className="text-xs">
                  LOCKED
                </Badge>
              )}
            </div>
            <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-zinc-900">{goal.title}</h3>
          </div>
          <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-7 w-7"
              onClick={() => canEdit && onEdit(goal)}
              disabled={!canEdit}
              title="Edit goal"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-7 w-7 text-rose-600 hover:border-rose-200 hover:bg-rose-50"
              onClick={() => canEdit && handleDelete()}
              disabled={!canEdit}
              title="Delete goal"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {goal.labels && goal.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {goal.labels.slice(0, 4).map((gl) => (
              <span
                key={gl.label.id}
                className="rounded-full border border-zinc-200 px-2 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: gl.label.color || '#f4f4f5', color: '#000' }}
              >
                {gl.label.name}
              </span>
            ))}
          </div>
        )}

        {goal.description && (
          <HtmlContent
            html={goal.description}
            className="prose prose-sm line-clamp-2 max-w-none text-[12px] leading-relaxed text-zinc-600"
          />
        )}

        {/* Progress section pinned to bottom for consistent card heights. */}
        <div className="mt-auto space-y-1.5 pt-1">
          <div className="flex items-baseline justify-between text-[11px]">
            <span className="font-semibold tabular-nums text-zinc-900">
              {goal.loggedHours.toFixed(1)}h
              <span className="ml-1 font-normal text-zinc-400">/ {goal.targetHours}h</span>
            </span>
            <span className="text-[16px] font-bold tabular-nums text-zinc-900">
              {progress}
              <span className="text-[10px] font-semibold text-zinc-400">%</span>
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-[#f2cc0d] transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {goal.deadline && (
            <div className="text-xs text-zinc-500">Deadline · {format(new Date(goal.deadline), 'MMM d, yyyy')}</div>
          )}
        </div>

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
