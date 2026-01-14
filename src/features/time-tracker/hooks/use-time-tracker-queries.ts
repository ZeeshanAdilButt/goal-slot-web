import { useGoalsQuery } from '@/features/goals/hooks/use-goals-queries'
import { useWeeklySchedule } from '@/features/schedule/hooks/use-schedule-queries'
import { useTasksQuery } from '@/features/tasks'
import { fetchRecentEntries, timeTrackerQueries } from '@/features/time-tracker/utils/queries'
import { useQuery } from '@tanstack/react-query'

export function useTimeTrackerData() {
  const goalsQuery = useGoalsQuery({ status: 'ACTIVE' })

  const tasksQuery = useTasksQuery({ statuses: ['BACKLOG', 'TODO', 'DOING'] })

  const recentEntriesQuery = useQuery({
    queryKey: timeTrackerQueries.recentEntries(),
    queryFn: fetchRecentEntries,
  })

  const weeklyScheduleQuery = useWeeklySchedule()

  const tasks = tasksQuery.data || []

  return {
    goals: goalsQuery.data || [],
    tasks,
    recentEntries: recentEntriesQuery.data || [],
    weeklySchedule: weeklyScheduleQuery.data,
    isLoading:
      goalsQuery.isLoading || tasksQuery.isLoading || recentEntriesQuery.isLoading || weeklyScheduleQuery.isLoading,
    isError: goalsQuery.isError || tasksQuery.isError || recentEntriesQuery.isError || weeklyScheduleQuery.isError,
  }
}
