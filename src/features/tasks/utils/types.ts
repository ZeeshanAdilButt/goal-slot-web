import type { TaskAssigneeRef, TaskProjectRef } from '@/features/projects/utils/types'

export type TaskStatus ='BACKLOG' | 'TODO' | 'DOING' | 'DONE'

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
  createdAt?: string
  /** null for anyone but the creator: goals and schedule blocks are personal. */
  goalId?: string | null
  goal?: Goal | null
  scheduleBlockId?: string | null
  scheduleBlock?: ScheduleBlock | null
  order?: number
  notes?: string
  /** Creator. On a project task this is who made it, not who owns the board. */
  userId?: string
  projectId?: string | null
  project?: TaskProjectRef | null
  assigneeId?: string | null
  assignee?: TaskAssigneeRef | null
  /** Server-computed write access for the requester. */
  canEdit?: boolean
}

export interface CreateTaskForm {
  title: string
  description: string
  category: string
  estimatedMinutes: string
  goalId: string
  scheduleBlockId: string
  dueDate: string
  notes?: string
  /** Omitted = unchanged. null moves a task back to My tasks (edit only). */
  projectId?: string | null
  /** Omitted = unchanged. null unassigns (edit only). */
  assigneeId?: string | null
}

export type GroupBy = 'status' | 'day' | 'schedule'

export type GroupedTasks = Array<[string, Task[]]>
