import { scheduleQueries } from '@/features/schedule/utils/queries'
import { SchedulePayload, ScheduleUpdatePayload, WeekSchedule } from '@/features/schedule/utils/types'
import { useQueryClient } from '@tanstack/react-query'

import { useOfflineMutation } from '@/hooks/use-offline-mutation'
import { genId } from '@/lib/offline/id'
import { timeToMinutes } from '@/lib/utils'

import '@/features/schedule/utils/offline-operations'

type ScheduleCreatePayload = SchedulePayload & { id?: string }

const weeklyKey = scheduleQueries.weekly().queryKey

const insertBlock = (schedule: WeekSchedule, block: ScheduleCreatePayload): WeekSchedule => {
  const next: WeekSchedule = { ...schedule }
  const day = block.dayOfWeek
  next[day] = [
    ...(next[day] || []),
    {
      id: block.id || genId(),
      title: block.title,
      startTime: block.startTime,
      endTime: block.endTime,
      dayOfWeek: block.dayOfWeek,
      category: block.category,
      color: block.color,
      isRecurring: true,
      seriesId: block.seriesId || block.id || genId(),
      goalId: block.goalId,
      isPrivate: block.isPrivate ?? false,
    },
  ].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
  return next
}

export function useCreateScheduleBlocks() {
  const queryClient = useQueryClient()

  return useOfflineMutation<SchedulePayload[], { previous: WeekSchedule | undefined }>({
    kind: 'schedule.createMany',
    buildPayload: (payloads) => payloads.map((payload) => ({ ...payload, id: genId() })),
    optimisticUpdate: (_payloads, _meta, payload) => {
      const previous = queryClient.getQueryData<WeekSchedule>(weeklyKey)
      const blocks = payload as ScheduleCreatePayload[]
      queryClient.setQueryData<WeekSchedule>(weeklyKey, (current = {}) =>
        blocks.reduce((next, block) => insertBlock(next, block), current),
      )
      return { previous }
    },
    rollback: (ctx) => queryClient.setQueryData(weeklyKey, ctx?.previous),
    invalidateKeys: [weeklyKey],
  })
}

export function useUpdateScheduleBlock() {
  const queryClient = useQueryClient()

  return useOfflineMutation<{ id: string; data: ScheduleUpdatePayload }, { previous: WeekSchedule | undefined }>({
    kind: 'schedule.update',
    buildPayload: ({ id, data }) => ({ id, data }),
    optimisticUpdate: ({ id, data }) => {
      const previous = queryClient.getQueryData<WeekSchedule>(weeklyKey)

      if (previous && data.updateScope !== 'series') {
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

        const { updateScope: _ignoredScope, ...blockChanges } = data

        const updatedBlock = {
          ...existing,
          ...blockChanges,
        }

        const targetDay = blockChanges.dayOfWeek ?? existing.dayOfWeek
        const updatedDay = [...(next[targetDay] || []), updatedBlock].sort(
          (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
        )
        next[targetDay] = updatedDay

        queryClient.setQueryData(weeklyKey, next)
      }

      return { previous }
    },
    rollback: (ctx) => queryClient.setQueryData(weeklyKey, ctx?.previous),
    invalidateKeys: [weeklyKey],
  })
}

export function useDeleteScheduleBlock() {
  const queryClient = useQueryClient()

  return useOfflineMutation<string, { previous: WeekSchedule | undefined }>({
    kind: 'schedule.delete',
    buildPayload: (id) => ({ id }),
    optimisticUpdate: (id) => {
      const previous = queryClient.getQueryData<WeekSchedule>(weeklyKey)
      if (previous) {
        const next: WeekSchedule = { ...previous }
        Object.keys(next).forEach((dayKey) => {
          const day = Number(dayKey)
          next[day] = (next[day] || []).filter((block) => block.id !== id)
        })
        queryClient.setQueryData(weeklyKey, next)
      }
      return { previous }
    },
    rollback: (ctx) => queryClient.setQueryData(weeklyKey, ctx?.previous),
    invalidateKeys: [weeklyKey],
  })
}
