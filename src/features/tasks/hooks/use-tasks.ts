import { useState } from 'react'

import { useTasksQuery } from '@/features/tasks/hooks/use-tasks-queries'
import { Goal, ScheduleBlock, Task, TaskStatus } from '@/features/tasks/utils/types'
import { useQuery } from '@tanstack/react-query'

import { goalsApi, scheduleApi } from '@/lib/api'

export function useTasks() {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('')

  const tasksQuery = useTasksQuery(statusFilter ? { status: statusFilter } : undefined)

  const scheduleQuery = useQuery({
    queryKey: ['schedule-blocks'],
    queryFn: async () => {
      const res = await scheduleApi.getAll()
      return res.data
    },
  })

  const goalsQuery = useQuery({
    queryKey: ['goals', 'active'],
    queryFn: async () => {
      const res = await goalsApi.getAll('ACTIVE')
      return res.data
    },
  })

  return {
    tasks: (tasksQuery.data as Task[]) || [],
    scheduleBlocks: (scheduleQuery.data as ScheduleBlock[]) || [],
    goals: (goalsQuery.data as Goal[]) || [],
    isLoading: tasksQuery.isLoading || scheduleQuery.isLoading || goalsQuery.isLoading,
    statusFilter,
    setStatusFilter,
    refresh: tasksQuery.refetch,
  }
}
