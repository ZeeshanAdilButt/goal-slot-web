export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED'

export interface LabelInput {
  name: string
  color?: string
}

export interface GoalLabel {
  id: string
  labelId: string
  label: {
    id: string
    name: string
    value: string
    color: string
  }
}

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
  labels?: GoalLabel[]
}

export interface CreateGoalForm {
  title: string
  description?: string
  category: string
  targetHours: number
  deadline?: string
  color: string
  status?: GoalStatus
  labels?: LabelInput[]  // Label objects with name and color
}

export interface UpdateGoalForm extends Partial<CreateGoalForm> {
  status?: GoalStatus
  loggedHours?: number
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
  labels: LabelInput[]  // Labels with name and color
}

// Notion-style label colors
export const LABEL_COLORS = [
  { name: 'Red', value: '#FEE2E2', textColor: '#991B1B' },
  { name: 'Orange', value: '#FED7AA', textColor: '#9A3412' },
  { name: 'Yellow', value: '#FEF3C7', textColor: '#92400E' },
  { name: 'Green', value: '#D1FAE5', textColor: '#065F46' },
  { name: 'Cyan', value: '#CFFAFE', textColor: '#0E7490' },
  { name: 'Blue', value: '#DBEAFE', textColor: '#1E40AF' },
  { name: 'Purple', value: '#E9D5FF', textColor: '#6B21A8' },
  { name: 'Pink', value: '#FCE7F3', textColor: '#9D174D' },
  { name: 'Gray', value: '#E5E7EB', textColor: '#374151' },
]

export interface GoalFilters {
  status?: string
  categories?: string[]
  labelIds?: string[]
}

export const GOAL_STATUS_OPTIONS: { value: GoalStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'COMPLETED', label: 'Completed' },
]
