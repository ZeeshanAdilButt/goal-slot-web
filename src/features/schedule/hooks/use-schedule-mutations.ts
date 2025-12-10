import { useMutation, useQueryClient } from '@tanstack/react-query'

import { scheduleApi } from '@/lib/api'

import { scheduleQueries } from '@/features/schedule/utils/queries'
import { SchedulePayload } from '@/features/schedule/utils/types'

export function useCreateScheduleBlocks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payloads: SchedulePayload[]) =>
      Promise.all(payloads.map((payload) => scheduleApi.create(payload))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleQueries.weekly().queryKey })
    },
  })
}

export function useUpdateScheduleBlock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SchedulePayload }) =>
      scheduleApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleQueries.weekly().queryKey })
    },
  })
}

export function useDeleteScheduleBlock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => scheduleApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleQueries.weekly().queryKey })
    },
  })
}
