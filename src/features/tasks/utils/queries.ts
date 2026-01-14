import { TaskStatus } from '@/features/tasks/utils/types'

import { tasksApi } from '@/lib/api'

export const taskQueries = {
  all: ['tasks'] as const,
  list: (filters?: { status?: TaskStatus; statuses?: TaskStatus[]; goalId?: string }) =>
    [...taskQueries.all, 'list', filters] as const,
  detail: (id: string) => [...taskQueries.all, 'detail', id] as const,
}

export const fetchTasks = async (filters?: { status?: TaskStatus; statuses?: TaskStatus[]; goalId?: string }) => {
  const res = await tasksApi.list(filters)
  return res.data
}
