export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED'

export interface Goal {
  id: string
  title: string
  description?: string
  category: string
  targetHours: number
  loggedHours: number
  deadline?: string
  status: GoalStatus
  color: string
}

export interface CreateGoalForm {
  title: string
  description?: string
  category: string
  targetHours: number
  deadline?: string
  color: string
  status?: GoalStatus
}

export interface GoalStats {
  active: number
  completed: number
  paused: number
}

export interface GoalFormState {
  title: string
  description: string
  category: string
  targetHours: string
  deadline: string
  color: string
  status: GoalStatus
}

export const GOAL_STATUS_OPTIONS: { value: GoalStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'COMPLETED', label: 'Completed' },
]
