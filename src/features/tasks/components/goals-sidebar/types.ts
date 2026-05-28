import { Goal } from '@/features/tasks/utils/types'

export const WITHOUT_GOALS_ID = '__WITHOUT_GOALS__'

export interface GoalsSidebarProps {
  goals: Goal[]
  selectedGoalId: string | null
  onSelectGoal: (id: string | null) => void
  selectedStatus: string
  onSelectStatus: (status: string) => void
  isLoading: boolean
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  /** Goal ids that have at least one schedule block in the current week. */
  activeGoalIds?: Set<string>
  /** Map of goalId -> minutes until next scheduled occurrence (0 = active now). */
  goalNextBlockMinutes?: Map<string, number>
}

export const GOAL_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' },
] as const
