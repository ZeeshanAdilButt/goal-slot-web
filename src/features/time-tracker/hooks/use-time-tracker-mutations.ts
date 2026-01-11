import { focusQueries } from '@/features/reports/hooks/use-focus-time-entries'
import { taskQueries } from '@/features/tasks/utils/queries'
import { timeTrackerQueries } from '@/features/time-tracker/utils/queries'
import { CreateTimeEntryPayload, TimeEntry } from '@/features/time-tracker/utils/types'
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
      queryClient.invalidateQueries({ queryKey: ['goals', 'active'] })
      queryClient.invalidateQueries({ queryKey: ['schedule', 'goals', 'active'] })
      queryClient.invalidateQueries({ queryKey: ['time-tracker', 'goals'] })
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
      queryClient.invalidateQueries({ queryKey: ['goals', 'active'] })
      queryClient.invalidateQueries({ queryKey: ['schedule', 'goals', 'active'] })
      queryClient.invalidateQueries({ queryKey: ['time-tracker', 'goals'] })
      queryClient.invalidateQueries({ queryKey: focusQueries.all })
    },
  })
}
