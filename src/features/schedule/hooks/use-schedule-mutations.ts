import { scheduleQueries } from '@/features/schedule/utils/queries'
import { SchedulePayload, WeekSchedule } from '@/features/schedule/utils/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { scheduleApi } from '@/lib/api'
import { timeToMinutes } from '@/lib/utils'

export function useCreateScheduleBlocks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payloads: SchedulePayload[]) => Promise.all(payloads.map((payload) => scheduleApi.create(payload))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleQueries.weekly().queryKey })
    },
  })
}

export function useUpdateScheduleBlock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: scheduleQueries.mutation.update(),
    mutationFn: async ({ id, data }: { id: string; data: SchedulePayload }) => {
      return scheduleApi.update(id, data)
    },
    onMutate: async ({ id, data }) => {
      const queryKey = scheduleQueries.weekly().queryKey
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData(queryKey)
      const rollback = () => queryClient.setQueryData(queryKey, previous)

      if (previous) {
        const next: WeekSchedule = { ...previous }

        Object.keys(next).forEach((dayKey) => {
          const dayIdx = Number(dayKey)
          next[dayIdx] = (next[dayIdx] || []).filter((b) => b.id !== id)
        })

        const existing =
          Object.values(previous)
            .flat()
            .find((b) => b.id === id) ||
          ({
            id,
            isRecurring: false,
          } as any)

        const updatedBlock = {
          ...existing,
          ...data,
        }

        const targetDay = data.dayOfWeek
        const updatedDay = [...(next[targetDay] || []), updatedBlock].sort(
          (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
        )
        next[targetDay] = updatedDay

        queryClient.setQueryData(queryKey, next)
      }

      return rollback
    },
    onError: (_err, _variables, rollback) => {
      rollback?.()
    },
    onSettled: () => {
      const remaining = queryClient.isMutating({ mutationKey: ['schedule', 'update'] })
      if (remaining === 0) {
        queryClient.invalidateQueries({ queryKey: scheduleQueries.weekly().queryKey })
      }
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
