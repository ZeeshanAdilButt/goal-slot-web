import { GoalItem } from '@/features/goals/components/goal-item'
import { Goal } from '@/features/goals/utils/types'
import { Plus, Target } from 'lucide-react'

interface GoalsListProps {
  goals: Goal[]
  isLoading: boolean
  filter: string
  onEdit: (goal: Goal) => void
  onCreateClick: () => void
}

export function GoalsList({ goals, isLoading, filter, onEdit, onCreateClick }: GoalsListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 animate-pulse bg-gray-200" />
        ))}
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
    <div className="grid grid-cols-3 gap-6">
      {goals.map((goal, i) => (
        <GoalItem key={goal.id} goal={goal} index={i} onEdit={onEdit} />
      ))}
    </div>
  )
}
