import { dashboardQueries, fetchDashboardStats, fetchRecentTimeEntries } from '@/features/dashboard/utils/queries'
import { DashboardStats, RecentTimeEntriesResponse } from '@/features/dashboard/utils/types'
import { useGoalsQuery } from '@/features/goals/hooks/use-goals-queries'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'

export function useDashboardStatsQuery(): UseQueryResult<DashboardStats> {
  return useQuery<DashboardStats>({
    queryKey: dashboardQueries.stats(),
    queryFn: fetchDashboardStats,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  })
}

export function useRecentTimeEntriesQuery(params?: {
  page?: number
  pageSize?: number
  startDate?: string
  endDate?: string
}): UseQueryResult<RecentTimeEntriesResponse> {
  return useQuery<RecentTimeEntriesResponse>({
    queryKey: dashboardQueries.recentEntries(params),
    queryFn: () => fetchRecentTimeEntries(params),
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    placeholderData: (previousData) => previousData,
  })
}

export function useDashboardData() {
  const statsQuery = useDashboardStatsQuery()
  const goalsQuery = useGoalsQuery({ status: 'ACTIVE' })
  const recentActivityQuery = useRecentTimeEntriesQuery({
    page: 1,
    pageSize: 5,
  })

  return {
    stats: statsQuery.data,
    goals: goalsQuery.data || [],
    recentActivity: recentActivityQuery.data?.items || [],
    isPending: statsQuery.isPending || goalsQuery.isPending || recentActivityQuery.isPending,
  }
}
