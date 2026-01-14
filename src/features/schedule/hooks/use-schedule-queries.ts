import { scheduleQueries } from '@/features/schedule/utils/queries'
import { useQuery } from '@tanstack/react-query'

export function useWeeklySchedule() {
  return useQuery({
    ...scheduleQueries.weekly(),
  })
}
