import { taskQueries } from '@/features/tasks/utils/queries'
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
      // Invalidate tasks cache because trackedMinutes changes
      queryClient.invalidateQueries({ queryKey: taskQueries.all })
      // Invalidate goals cache because loggedHours changes
      queryClient.invalidateQueries({ queryKey: ['goals', 'active'] })
      queryClient.invalidateQueries({ queryKey: ['schedule', 'goals', 'active'] })
      queryClient.invalidateQueries({ queryKey: ['time-tracker', 'goals'] })
      toast.success('Time entry saved!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save entry')
    },
  })
}
