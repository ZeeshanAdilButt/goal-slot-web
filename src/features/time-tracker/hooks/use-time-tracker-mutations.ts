import { focusQueries } from '@/features/reports/hooks/use-focus-time-entries'
import { goalQueries } from '@/features/goals/utils/queries'
import { taskQueries } from '@/features/tasks/utils/queries'
import { timeTrackerQueries } from '@/features/time-tracker/utils/queries'
import { CreateTimeEntryPayload, TimeEntry, UpdateTimeEntryPayload } from '@/features/time-tracker/utils/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { timeEntriesApi } from '@/lib/api'

export function useCreateTimeEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateTimeEntryPayload) => {
      const res = await timeEntriesApi.create(payload)
      return res.data
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: timeTrackerQueries.recentEntries() })
      const previous = queryClient.getQueryData<TimeEntry[]>(timeTrackerQueries.recentEntries())
      const optimisticEntry: TimeEntry = {
        id: `optimistic-${Date.now()}`,
        taskName: payload.taskName,
        notes: payload.notes,
        duration: payload.duration,
        date: payload.date,
        scheduleBlockId: payload.scheduleBlockId,
        goalId: payload.goalId,
        startedAt: payload.startedAt,
        taskId: payload.taskId,
        taskTitle: payload.taskTitle,
      }

      if (Array.isArray(previous)) {
        queryClient.setQueryData(timeTrackerQueries.recentEntries(), [optimisticEntry, ...previous])
      }

      return { previous, optimisticId: optimisticEntry.id }
    },
    onSuccess: (createdEntry, _variables, context) => {
      if (createdEntry) {
        const current = queryClient.getQueryData<TimeEntry[]>(timeTrackerQueries.recentEntries())
        if (Array.isArray(current)) {
          queryClient.setQueryData(
            timeTrackerQueries.recentEntries(),
            current.map((entry) => (entry.id === context?.optimisticId ? createdEntry : entry)),
          )
        }
      }

      toast.success('Time entry saved!')
    },
    onError: (error: any, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(timeTrackerQueries.recentEntries(), context.previous)
      }
      toast.error(error.response?.data?.message || 'Failed to save entry')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: timeTrackerQueries.recentEntries() })
      queryClient.invalidateQueries({ queryKey: ['time-tracker', 'recent-entries', 'paged'] })
      // Invalidate tasks cache because trackedMinutes changes
      queryClient.invalidateQueries({ queryKey: taskQueries.all })
      // Invalidate goals cache because loggedHours changes
      queryClient.invalidateQueries({ queryKey: goalQueries.all })
      queryClient.invalidateQueries({ queryKey: ['schedule', 'goals', 'active'] })
      // Invalidate reports queries to refresh reports when time is logged
      queryClient.invalidateQueries({ queryKey: focusQueries.all })
    },
  })
}

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (entryId: string) => {
      await timeEntriesApi.delete(entryId)
      return entryId
    },
    onMutate: async (entryId) => {
      await queryClient.cancelQueries({ queryKey: timeTrackerQueries.recentEntries() })
      const previous = queryClient.getQueryData<TimeEntry[]>(timeTrackerQueries.recentEntries())

      if (Array.isArray(previous)) {
        queryClient.setQueryData(
          timeTrackerQueries.recentEntries(),
          previous.filter((entry) => entry.id !== entryId),
        )
      }

      return { previous }
    },
    onError: (error: any, _entryId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(timeTrackerQueries.recentEntries(), context.previous)
      }
      toast.error(error.response?.data?.message || 'Failed to delete time entry')
    },
    onSuccess: () => {
      toast.success('Time entry deleted')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: timeTrackerQueries.recentEntries() })
      queryClient.invalidateQueries({ queryKey: ['time-tracker', 'recent-entries', 'paged'] })
      queryClient.invalidateQueries({ queryKey: taskQueries.all })
      queryClient.invalidateQueries({ queryKey: goalQueries.all })
      queryClient.invalidateQueries({ queryKey: ['schedule', 'goals', 'active'] })
      queryClient.invalidateQueries({ queryKey: focusQueries.all })
    },
  })
}

export function useUpdateTimeEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ entryId, data }: { entryId: string; data: UpdateTimeEntryPayload }) => {
      const res = await timeEntriesApi.update(entryId, data)
      return res.data
    },
    onSuccess: () => {
      toast.success('Time entry updated!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update entry')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: timeTrackerQueries.recentEntries() })
      queryClient.invalidateQueries({ queryKey: ['time-tracker', 'recent-entries', 'paged'] })
      queryClient.invalidateQueries({ queryKey: taskQueries.all })
      queryClient.invalidateQueries({ queryKey: goalQueries.all })
      queryClient.invalidateQueries({ queryKey: ['schedule', 'goals', 'active'] })
      queryClient.invalidateQueries({ queryKey: focusQueries.all })
    },
  })
}
