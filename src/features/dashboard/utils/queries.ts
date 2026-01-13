import { reportsApi, timeEntriesApi } from '@/lib/api'

import { DashboardStats, RecentTimeEntriesResponse } from './types'

export const dashboardQueries = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardQueries.all, 'stats'] as const,
  recentEntries: (params?: { page?: number; pageSize?: number; startDate?: string; endDate?: string }) =>
    [...dashboardQueries.all, 'recent-entries', params] as const,
}

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const res = await reportsApi.getDashboard()
  return res.data
}

export const fetchRecentTimeEntries = async (params?: {
  page?: number
  pageSize?: number
  startDate?: string
  endDate?: string
}): Promise<RecentTimeEntriesResponse> => {
  const res = await timeEntriesApi.getRecent(params)
  const data = res.data as any
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      page: params?.page || 1,
      pageSize: params?.pageSize || 5,
      hasNextPage: false,
    }
  }
  return data
}
