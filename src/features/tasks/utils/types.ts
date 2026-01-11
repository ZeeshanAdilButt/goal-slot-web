export type TaskStatus = 'BACKLOG' | 'TODO' | 'DOING' | 'DONE'

export interface Goal {
  id: string
  title: string
  color: string
  status: string
  category?: string
  order?: number
}

export interface ScheduleBlock {
  id: string
  title: string
  startTime: string
  endTime: string
  dayOfWeek: number
  goalId?: string
}

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  category?: string
  estimatedMinutes?: number
  actualMinutes?: number
  trackedMinutes?: number
  dueDate?: string
  completedAt?: string
  goalId?: string
  goal?: Goal
  scheduleBlockId?: string
  scheduleBlock?: ScheduleBlock
  order?: number
}

export interface CreateTaskForm {
  title: string
  description: string
  category: string
  estimatedMinutes: string
  goalId: string
  scheduleBlockId: string
  dueDate: string
}

export type GroupBy = 'status' | 'day' | 'schedule'

export type GroupedTasks = Array<[string, Task[]]>
