import { TaskStatus } from '@/features/tasks/utils/types'

import { tasksApi } from '@/lib/api'

export type TaskListFilters = {
  status?: TaskStatus
  statuses?: TaskStatus[]
  goalId?: string
  scope?: 'mine' | 'personal'
  projectId?: string
}

export const taskQueries = {
  all: ['tasks'] as const,
  list: (filters?: TaskListFilters) => [...taskQueries.all, 'list', filters] as const,
  detail: (id: string) => [...taskQueries.all, 'detail', id] as const,
}

export const fetchTasks = async (filters?: TaskListFilters) => {
  const res = await tasksApi.list(filters)
  return res.data
}
