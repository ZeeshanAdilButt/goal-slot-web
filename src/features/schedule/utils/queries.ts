import { Goal, WeekSchedule } from '@/features/schedule/utils/types'
import { queryOptions } from '@tanstack/react-query'

import { goalsApi, scheduleApi } from '@/lib/api'

export const scheduleQueries = {
  root: () => ['schedule'] as const,

  weeklyKey: () => [...scheduleQueries.root(), 'weekly'] as const,
  goalsKey: () => [...scheduleQueries.root(), 'goals'] as const,
  mutation: {
    update: () => [...scheduleQueries.root(), 'update'] as const,
    create: () => [...scheduleQueries.root(), 'create'] as const,
    delete: () => [...scheduleQueries.root(), 'delete'] as const,
  },

  weekly: () =>
    queryOptions({
      queryKey: scheduleQueries.weeklyKey(),
      queryFn: async (): Promise<WeekSchedule> => {
        const res = await scheduleApi.getWeekly()
        return res.data
      },
    }),

  goalsActive: () =>
    queryOptions({
      queryKey: [...scheduleQueries.goalsKey(), 'active'] as const,
      queryFn: async (): Promise<Goal[]> => {
        const res = await goalsApi.getAll({ status: 'ACTIVE' })
        return res.data
      },
    }),
} as const
