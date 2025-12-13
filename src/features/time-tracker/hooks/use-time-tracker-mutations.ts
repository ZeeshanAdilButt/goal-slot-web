import { useMutation, useQueryClient } from '@tanstack/react-query'
import { timeEntriesApi } from '@/lib/api'
import { timeTrackerQueries } from '../utils/queries'
import { CreateTimeEntryPayload } from '../utils/types'
import { toast } from 'react-hot-toast'

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
