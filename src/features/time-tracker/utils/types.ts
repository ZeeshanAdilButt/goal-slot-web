export interface Goal {
  id: string
  title: string
  color: string
  category?: string
}

export interface TimeEntry {
  id: string
  taskName: string
  notes?: string
  duration: number
  date: string
  goalId?: string
  goal?: Goal
  startedAt?: string
  taskId?: string
  taskTitle?: string
}

export interface Task {
  id: string
  title: string
  category?: string
  goalId?: string
  goalTitle?: string
  goal?: { id: string; title: string; color: string }
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
}

export interface CreateTimeEntryPayload {
  taskName: string
  taskId?: string
  taskTitle?: string
  duration: number
  date: string
  notes?: string
  goalId?: string
  startedAt?: string
}
