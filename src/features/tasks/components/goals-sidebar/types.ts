import { Goal } from '@/features/tasks/utils/types'

export interface GoalsSidebarProps {
  goals: Goal[]
  selectedGoalId: string | null
  onSelectGoal: (id: string) => void
  selectedStatus: string
  onSelectStatus: (status: string) => void
}

export const GOAL_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' },
] as const
