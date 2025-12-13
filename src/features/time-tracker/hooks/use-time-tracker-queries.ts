import { useQuery } from '@tanstack/react-query'
import { fetchGoals, fetchRecentEntries, fetchTasks, timeTrackerQueries } from '../utils/queries'

export function useTimeTrackerData() {
  const goalsQuery = useQuery({
    queryKey: timeTrackerQueries.goals(),
    queryFn: fetchGoals,
  })

  const tasksQuery = useQuery({
    queryKey: timeTrackerQueries.tasks(),
    queryFn: fetchTasks,
  })

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
