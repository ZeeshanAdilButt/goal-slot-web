import { goalsApi, timeEntriesApi } from '@/lib/api'

export const timeTrackerQueries = {
  all: ['time-tracker'] as const,
  goals: () => [...timeTrackerQueries.all, 'goals'] as const,
  recentEntries: () => [...timeTrackerQueries.all, 'recent-entries'] as const,
}

export const fetchGoals = async () => {
  const res = await goalsApi.getAll('ACTIVE')
  return res.data
}

export const fetchRecentEntries = async () => {
  const res = await timeEntriesApi.getByDateRange(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    new Date().toISOString().split('T')[0],
  )
  return res.data
}
