import { scheduleQueries } from '@/features/schedule/utils/queries'
import { SchedulePayload, ScheduleUpdatePayload, WeekSchedule } from '@/features/schedule/utils/types'
import { onlineManager, useMutation, useQueryClient } from '@tanstack/react-query'

import { useOfflineMutation } from '@/hooks/use-offline-mutation'
import { scheduleApi } from '@/lib/api'
import { genId } from '@/lib/offline/id'
import { timeToMinutes } from '@/lib/utils'

import '@/features/schedule/utils/offline-operations'

// The batch endpoint (POST /schedule/batch) rejects with a specific,
// actionable reason — e.g. which day conflicted — rather than a generic
// failure. Surface that text instead of always showing the same fixed
// toast. Same pattern as serverErrorMessage in features/notes/hooks/use-notes.ts
// and isPlanLimitError in features/time-tracker/hooks/use-time-tracker-mutations.ts.
export function serverErrorMessage(err: unknown): string | undefined {
  const message = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
  if (Array.isArray(message)) return message[0]
  return typeof message === 'string' ? message : undefined
}

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
    messages: {
      // Without this, useOfflineMutation's own onError showed a generic
      // "Something went wrong" toast AND schedule-block-modal.tsx's catch
      // block showed a second, specific one for the same failure. This hook
      // now owns the single error toast (schedule-block-modal.tsx no longer
      // shows its own for the create path) — same convention every other
      // feature's mutation hooks already follow.
      error: (err) => serverErrorMessage(err) ?? 'Failed to create block',
    },
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

export const SET_DAYS_OFFLINE_MESSAGE = 'Changing the days of a block needs an internet connection. Reconnect and try again.'

/**
 * Makes a block's series cover exactly `days` (POST /schedule/:id/days).
 *
 * Online only, unlike the other mutations here. The server does the whole
 * change atomically and can reject it (a conflict names the clashing block),
 * and the caller usually runs it right after a queued-able field update, so
 * queueing it would leave the user unsure which half landed. Offline it fails
 * up front with SET_DAYS_OFFLINE_MESSAGE.
 *
 * No error toast here: the caller owns the wording because it depends on what
 * the earlier steps of the same save already did.
 */
export function useSetScheduleBlockDays() {
  const queryClient = useQueryClient()

  return useMutation({
    networkMode: 'always',
    mutationFn: async ({ id, days }: { id: string; days: number[] }) => {
      if (!onlineManager.isOnline()) throw new Error(SET_DAYS_OFFLINE_MESSAGE)
      const res = await scheduleApi.setDays(id, days)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: weeklyKey })
    },
  })
}

