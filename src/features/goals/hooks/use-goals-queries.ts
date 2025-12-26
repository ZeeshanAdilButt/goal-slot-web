import { fetchGoals, fetchGoalStats, goalQueries } from '@/features/goals/utils/queries'
import { Goal, GoalFilters, GoalStats } from '@/features/goals/utils/types'
import { useQuery } from '@tanstack/react-query'

export function useGoalsQuery(filters?: GoalFilters) {
  return useQuery<Goal[]>({
    queryKey: goalQueries.list(filters),
    queryFn: () => fetchGoals(filters),
  })
}

export function useGoalStatsQuery() {
  return useQuery<GoalStats>({
    queryKey: goalQueries.stats(),
    queryFn: fetchGoalStats,
  })
}
