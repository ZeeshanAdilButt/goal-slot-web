import { timeEntriesApi } from '@/lib/api'

export const timeTrackerQueries = {
  all: ['time-tracker'] as const,
  recentEntries: () => [...timeTrackerQueries.all, 'recent-entries'] as const,
}

export const fetchRecentEntries = async () => {
  const res = await timeEntriesApi.getByDateRange(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    new Date().toISOString().split('T')[0],
  )
  return res.data
}
