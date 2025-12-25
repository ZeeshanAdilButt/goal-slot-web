import { goalsApi } from '@/lib/api'

import { GoalFilters } from './types'

export const goalQueries = {
  all: ['goals'] as const,
  list: (filters?: GoalFilters) => [...goalQueries.all, 'list', filters] as const,
  detail: (id: string) => [...goalQueries.all, 'detail', id] as const,
  stats: () => [...goalQueries.all, 'stats'] as const,
}

export const fetchGoals = async (filters?: GoalFilters) => {
  const params: { status?: string; categories?: string; labelIds?: string } = {}
  
  if (filters?.status) params.status = filters.status
  if (filters?.categories && filters.categories.length > 0) {
    params.categories = filters.categories.join(',')
  }
  if (filters?.labelIds && filters.labelIds.length > 0) {
    params.labelIds = filters.labelIds.join(',')
  }
  
  const res = await goalsApi.getAll(params)
  return res.data
}

export const fetchGoalStats = async () => {
  const res = await goalsApi.getStats()
  return res.data
}
