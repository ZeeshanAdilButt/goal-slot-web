export interface FocusGoal {
  id: string
  title: string
  color?: string
  category?: string
}

export interface FocusTimeEntry {
  id: string
  taskName: string
  duration: number
  date: string
  startedAt?: string | null

  goalId?: string | null
  goal?: FocusGoal | null

  scheduleBlockId?: string | null
  scheduleBlock?: {
    id: string
    title: string
    category: string
  } | null

  taskId?: string | null
  taskTitle?: string | null
  task?: {
    id: string
    title: string
    category: string | null
  } | null
}

export type FocusGroupBy = 'goal' | 'task'
export type FocusGranularity = 'day' | 'week' | 'month'
export type FocusPeriod = 'week' | 'month'
