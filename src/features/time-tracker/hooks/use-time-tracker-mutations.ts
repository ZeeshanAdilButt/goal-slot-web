import { goalQueries } from '@/features/goals/utils/queries'
import { focusQueries } from '@/features/reports/hooks/use-focus-time-entries'
import { taskQueries } from '@/features/tasks/utils/queries'
import { timeTrackerQueries } from '@/features/time-tracker/utils/queries'
import { CreateTimeEntryPayload, TimeEntry, UpdateTimeEntryPayload } from '@/features/time-tracker/utils/types'
import { capture } from '@/utils/posthog/capture'
import { Events } from '@/utils/posthog/events'
import { useQueryClient } from '@tanstack/react-query'

import { useOfflineMutation } from '@/hooks/use-offline-mutation'

import '@/features/time-tracker/utils/offline-operations'

const invalidateKeys = [
  timeTrackerQueries.recentEntries(),
  ['time-tracker', 'recent-entries', 'paged'],
  taskQueries.all,
  goalQueries.all,
  ['schedule', 'goals', 'active'],
  focusQueries.all,
]

// FREE-plan users are capped at 3 time entries/day (see dw-time-api's
// plan-limits.ts + TimeEntriesService.create -> AuthService.checkPlanLimit).
// POST /time-entries is guarded by JwtAuthGuard only, so the daily cap is the
// sole source of a 403 on this endpoint — any 403 here is that cap. We still
// sanity-check the message so a future unrelated 403 on this route degrades
// to the generic error instead of showing this specific (and wrong) copy.
export function isPlanLimitError(err: unknown): boolean {
  const response = (err as { response?: { status?: number; data?: { message?: string } } })?.response
  if (response?.status !== 403) return false
  const message = response.data?.message
  return typeof message === 'string' && /plan limit/i.test(message)
}

export const PLAN_LIMIT_MESSAGE =
  "You've reached today's free-plan limit of 3 tracked sessions. This session is still running — upgrade to save it, or come back after midnight."

const optimisticEntry = (id: string, payload: CreateTimeEntryPayload): TimeEntry => ({
  id,
  taskName: payload.taskName,
  notes: payload.notes,
  duration: payload.duration,
  date: payload.date,
  scheduleBlockId: payload.scheduleBlockId,
  goalId: payload.goalId,
  startedAt: payload.startedAt,
  taskId: payload.taskId,
  taskTitle: payload.taskTitle,
})

export function useCreateTimeEntry() {
  const queryClient = useQueryClient()

  return useOfflineMutation<CreateTimeEntryPayload, { previous: TimeEntry[] | undefined }>({
    kind: 'timeEntry.create',
    buildPayload: (payload, meta) => ({ id: meta.entityId, ...payload }),
    optimisticUpdate: (payload, meta) => {
      const previous = queryClient.getQueryData<TimeEntry[]>(timeTrackerQueries.recentEntries())
      if (Array.isArray(previous)) {
        queryClient.setQueryData(timeTrackerQueries.recentEntries(), [optimisticEntry(meta.entityId, payload), ...previous])
      }
      return { previous }
    },
    rollback: (ctx) => queryClient.setQueryData(timeTrackerQueries.recentEntries(), ctx?.previous),
    invalidateKeys,
    messages: {
      offline: 'Time entry saved offline',
      success: 'Time entry saved!',
      error: (err) =>
        isPlanLimitError(err) ? { message: PLAN_LIMIT_MESSAGE, duration: 10000 } : 'Failed to save entry',
    },
    onServerSuccess: (_result, payload) => {
      capture(Events.TRACK_STARTED, {
        source: payload.taskId ? 'task' : payload.goalId ? 'goal' : 'adhoc',
      })
    },
  })
}

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient()

  return useOfflineMutation<string, { previous: TimeEntry[] | undefined }>({
    kind: 'timeEntry.delete',
    buildPayload: (entryId) => ({ id: entryId }),
    optimisticUpdate: (entryId) => {
      const previous = queryClient.getQueryData<TimeEntry[]>(timeTrackerQueries.recentEntries())
      if (Array.isArray(previous)) {
        queryClient.setQueryData(
          timeTrackerQueries.recentEntries(),
          previous.filter((entry) => entry.id !== entryId),
        )
      }
      return { previous }
    },
    rollback: (ctx) => queryClient.setQueryData(timeTrackerQueries.recentEntries(), ctx?.previous),
    invalidateKeys,
    messages: {
      offline: 'Time entry deletion saved offline',
      success: 'Time entry deleted',
      error: 'Failed to delete time entry',
    },
  })
}

export function useUpdateTimeEntry() {
  const queryClient = useQueryClient()

  return useOfflineMutation<
    { entryId: string; data: UpdateTimeEntryPayload },
    { previous: TimeEntry[] | undefined }
  >({
    kind: 'timeEntry.update',
    buildPayload: ({ entryId, data }) => ({ id: entryId, data }),
    optimisticUpdate: ({ entryId, data }) => {
      const previous = queryClient.getQueryData<TimeEntry[]>(timeTrackerQueries.recentEntries())
      if (Array.isArray(previous)) {
        queryClient.setQueryData(
          timeTrackerQueries.recentEntries(),
          previous.map((entry) => (entry.id === entryId ? { ...entry, ...data } : entry)),
        )
      }
      return { previous }
    },
    rollback: (ctx) => queryClient.setQueryData(timeTrackerQueries.recentEntries(), ctx?.previous),
    invalidateKeys,
    messages: {
      offline: 'Time entry update saved offline',
      success: 'Time entry updated!',
      error: 'Failed to update entry',
    },
  })
}
