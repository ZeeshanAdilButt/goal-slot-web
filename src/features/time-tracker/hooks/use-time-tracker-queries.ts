import { useTasksQuery } from '@/features/tasks'
import { fetchGoals, fetchRecentEntries, timeTrackerQueries } from '@/features/time-tracker/utils/queries'
import { useQuery } from '@tanstack/react-query'

export function useTimeTrackerData() {
  const goalsQuery = useQuery({
    queryKey: timeTrackerQueries.goals(),
    queryFn: fetchGoals,
  })

  const tasksQuery = useTasksQuery()

  const recentEntriesQuery = useQuery({
    queryKey: timeTrackerQueries.recentEntries(),
    queryFn: fetchRecentEntries,
  })

  return {
    goals: goalsQuery.data || [],
    tasks: tasksQuery.data || [],
    recentEntries: recentEntriesQuery.data || [],
    isLoading: goalsQuery.isLoading || tasksQuery.isLoading || recentEntriesQuery.isLoading,
    isError: goalsQuery.isError || tasksQuery.isError || recentEntriesQuery.isError,
  }
}
