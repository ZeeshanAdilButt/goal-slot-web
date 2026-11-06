import { fetchTasks, taskQueries, type TaskListFilters } from '@/features/tasks/utils/queries'
import { useQuery } from '@tanstack/react-query'

export function useTasksQuery(filters?: TaskListFilters) {
  return useQuery({
    queryKey: taskQueries.list(filters),
    queryFn: () => fetchTasks(filters),
  })
}
