import { GoalItem } from '@/features/goals/components/goal-item'
import { Goal } from '@/features/goals/utils/types'
import { Plus, Target } from 'lucide-react'

import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { GlassCard } from '@/components/ui/glass-card'
import { Loading } from '@/components/ui/loading'

interface GoalsListProps {
  goals: Goal[]
  isLoading: boolean
  filter: string
  onEdit: (goal: Goal) => void
  onCreateClick: () => void
}

export function GoalsList({ goals, isLoading, filter, onEdit, onCreateClick }: GoalsListProps) {
  const { user } = useAuthStore()
  const maxGoals = user?.limits?.maxGoals ?? 3
  const isUnlimited = !user || user.plan === 'PRO' || user.unlimitedAccess || user.userType === 'INTERNAL'

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loading size="sm" />
      </div>
    )
  }

  if (goals.length === 0) {
    return (
      <GlassCard>
        <EmptyState
          icon={<Target />}
          title={`No ${filter.toLowerCase()} goals`}
          description={
            filter === 'ACTIVE'
              ? 'Create your first goal to start tracking your progress.'
              : `No ${filter.toLowerCase()} goals yet`
          }
          action={
            filter === 'ACTIVE' ? (
              <Button onClick={onCreateClick} variant="brand" size="sm">
                <Plus className="h-4 w-4" />
                Create Goal
              </Button>
            ) : undefined
          }
        />
      </GlassCard>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {goals.map((goal, i) => {
        // For active goals, lock only when limit exists and user is not unlimited
        const isLocked = filter === 'ACTIVE' && !isUnlimited && i >= maxGoals
        return <GoalItem key={goal.id} goal={goal} index={i} onEdit={onEdit} isLocked={isLocked} />
      })}
    </div>
  )
}
