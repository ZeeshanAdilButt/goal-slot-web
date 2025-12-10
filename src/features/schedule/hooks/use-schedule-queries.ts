import { useQuery } from '@tanstack/react-query'

import { scheduleQueries } from '@/features/schedule/utils/queries'

export function useWeeklySchedule() {
  return useQuery(scheduleQueries.weekly())
}

export function useActiveGoals() {
  return useQuery(scheduleQueries.goalsActive())
}
