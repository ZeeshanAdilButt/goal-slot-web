import { GoalItem } from '@/features/goals/components/goal-item'
import { Goal } from '@/features/goals/utils/types'
import { Plus, Target } from 'lucide-react'

import { Loading } from '@/components/ui/loading'
import { useAuthStore } from '@/lib/store'

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

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loading size="sm" />
      </div>
    )
  }

  if (goals.length === 0) {
    return (
      <div className="card-brutal py-16 text-center">
        <Target className="mx-auto mb-4 h-16 w-16 text-gray-400" />
        <h3 className="mb-2 text-xl font-bold uppercase">No {filter.toLowerCase()} Goals</h3>
        <p className="mb-6 font-mono text-gray-600">
          {filter === 'ACTIVE'
            ? 'Create your first goal to start tracking your progress'
            : `No ${filter.toLowerCase()} goals yet`}
        </p>
        {filter === 'ACTIVE' && (
          <button onClick={onCreateClick} className="btn-brutal">
            <Plus className="mr-2 inline h-4 w-4" />
            Create Goal
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      {goals.map((goal, i) => {
        // For active goals, check if this goal is over the user's limit
        const isLocked = filter === 'ACTIVE' && i >= maxGoals
        return (
          <GoalItem key={goal.id} goal={goal} index={i} onEdit={onEdit} isLocked={isLocked} />
        )
      })}
    </div>
  )
}
