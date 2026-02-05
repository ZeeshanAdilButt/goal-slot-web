'use client'

import type { FocusTimeEntry } from '@/features/reports/utils/types'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { timeEntriesApi } from '@/lib/api'

export const focusQueries = {
  all: ['focus'] as const,
  entriesRange: (startDate: string, endDate: string) =>
    [...focusQueries.all, 'entries-range', startDate, endDate] as const,
}

export function useFocusTimeEntriesRangeQuery({
  startDate,
  endDate,
  enabled = true,
}: {
  startDate: string
  endDate: string
  enabled?: boolean
}): UseQueryResult<FocusTimeEntry[]> {
  return useQuery<FocusTimeEntry[]>({
    queryKey: focusQueries.entriesRange(startDate, endDate),
    queryFn: async (): Promise<FocusTimeEntry[]> => {
      const res = await timeEntriesApi.getByRange(startDate, endDate)
      return Array.isArray(res.data) ? res.data : []
    },
    enabled,
    placeholderData: (previousData) => previousData,
  })
}
