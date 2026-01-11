import { useTasksQuery } from '@/features/tasks'
import { useWeeklySchedule } from '@/features/schedule/hooks/use-schedule-queries'
import { fetchGoals, fetchRecentEntries, timeTrackerQueries } from '@/features/time-tracker/utils/queries'
import { Task } from '@/features/time-tracker/utils/types'
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

  const weeklyScheduleQuery = useWeeklySchedule()

  // Filter out completed/backlog tasks for time tracker
  const tasks = (tasksQuery.data || []).filter((task: Task) => task.status !== 'DONE' && task.status !== 'BACKLOG')

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
