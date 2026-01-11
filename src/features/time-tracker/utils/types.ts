import { TaskStatus } from '@/features/tasks/utils/types'

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
  scheduleBlockId?: string
  scheduleBlock?: { id: string; title: string; category?: string }
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
  status: TaskStatus
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
  scheduleBlockId?: string
}
