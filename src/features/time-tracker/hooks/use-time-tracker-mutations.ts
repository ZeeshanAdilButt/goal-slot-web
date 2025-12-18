import { timeTrackerQueries } from '@/features/time-tracker/utils/queries'
import { CreateTimeEntryPayload } from '@/features/time-tracker/utils/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { timeEntriesApi } from '@/lib/api'

export function useCreateTimeEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateTimeEntryPayload) => timeEntriesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeTrackerQueries.recentEntries() })
      toast.success('Time entry saved!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save entry')
    },
  })
}
