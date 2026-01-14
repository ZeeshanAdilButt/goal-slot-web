import { WeekSchedule } from '@/features/schedule/utils/types'
import { queryOptions } from '@tanstack/react-query'

import { scheduleApi } from '@/lib/api'

export const scheduleQueries = {
  root: () => ['schedule'] as const,

  weeklyKey: () => [...scheduleQueries.root(), 'weekly'] as const,
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
} as const
