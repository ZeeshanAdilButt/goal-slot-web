import { focusQueries } from '@/features/reports/hooks/use-focus-time-entries'
import { goalQueries } from '@/features/goals/utils/queries'
import { taskQueries } from '@/features/tasks/utils/queries'
import { timeTrackerQueries } from '@/features/time-tracker/utils/queries'
import { CreateTimeEntryPayload, TimeEntry, UpdateTimeEntryPayload } from '@/features/time-tracker/utils/types'
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
      error: 'Failed to save entry',
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
