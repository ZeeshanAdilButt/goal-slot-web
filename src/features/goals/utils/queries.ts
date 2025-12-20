import { goalsApi } from '@/lib/api'

export const goalQueries = {
  all: ['goals'] as const,
  list: (status?: string) => [...goalQueries.all, 'list', status] as const,
  detail: (id: string) => [...goalQueries.all, 'detail', id] as const,
  stats: () => [...goalQueries.all, 'stats'] as const,
}

export const fetchGoals = async (status?: string) => {
  const res = await goalsApi.getAll(status)
  return res.data
}

export const fetchGoalStats = async () => {
  const res = await goalsApi.getStats()
  return res.data
}
