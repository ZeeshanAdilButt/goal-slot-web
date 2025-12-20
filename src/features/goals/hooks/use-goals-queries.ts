import { fetchGoals, fetchGoalStats, goalQueries } from '@/features/goals/utils/queries'
import { Goal, GoalStats } from '@/features/goals/utils/types'
import { useQuery } from '@tanstack/react-query'

export function useGoalsQuery(status?: string) {
  return useQuery<Goal[]>({
    queryKey: goalQueries.list(status),
    queryFn: () => fetchGoals(status),
  })
}

export function useGoalStatsQuery() {
  return useQuery<GoalStats>({
    queryKey: goalQueries.stats(),
    queryFn: fetchGoalStats,
  })
}
