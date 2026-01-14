import { fetchTasks, taskQueries } from '@/features/tasks/utils/queries'
import { TaskStatus } from '@/features/tasks/utils/types'
import { useQuery } from '@tanstack/react-query'

export function useTasksQuery(filters?: { status?: TaskStatus; statuses?: TaskStatus[]; goalId?: string }) {
  return useQuery({
    queryKey: taskQueries.list(filters),
    queryFn: () => fetchTasks(filters),
  })
}
