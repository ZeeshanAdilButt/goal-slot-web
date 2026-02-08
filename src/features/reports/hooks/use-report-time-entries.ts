'use client'

import { useMemo } from 'react'

import type { FocusTimeEntry } from '@/features/reports/utils/types'
import { useSharedUserTimeEntriesQuery } from '@/features/sharing/hooks/use-sharing-queries'
import type { SharedTimeEntry } from '@/features/sharing/utils/types'

import { useFocusTimeEntriesRangeQuery } from './use-focus-time-entries'

/**
 * Shared API returns a narrower shape (id, taskName, duration, date, goal).
 * Report cards expect FocusTimeEntry (task object, goalId, scheduleBlock, etc.).
 * We adapt so aggregation/filtering code works unchanged; otherwise we'd need
 * the backend to return the same shape or all report code to handle both.
 */
function adaptSharedEntry(entry: SharedTimeEntry): FocusTimeEntry {
  return {
    id: entry.id,
    taskName: entry.taskName,
    duration: entry.duration,
    date: entry.date,
    startedAt: null,
    goalId: entry.goal?.id,
    goal: entry.goal
      ? {
          id: entry.goal.id,
          title: entry.goal.title,
          color: entry.goal.color,
          category: entry.goal.category,
        }
      : null,
    taskId: null,
    task: {
      id: 'shared-task',
      title: entry.taskName,
      category: null,
    },
    scheduleBlockId: null,
    scheduleBlock: null,
  }
}

interface UseReportTimeEntriesParams {
  startDate: string
  endDate: string
  reportUserId?: string
}

export function useReportTimeEntries({ startDate, endDate, reportUserId }: UseReportTimeEntriesParams) {
  const isSharedMode = !!reportUserId

  // Current user query (disabled when viewing a shared user's report)
  const currentUserQuery = useFocusTimeEntriesRangeQuery({
    startDate,
    endDate,
    enabled: !isSharedMode,
  })

  // Shared user query (disabled when viewing own report; only runs when reportUserId is set)
  const sharedUserQuery = useSharedUserTimeEntriesQuery(
    reportUserId ?? null,
    startDate,
    endDate,
    { enabled: isSharedMode },
  )

  // Select the appropriate query based on mode
  const activeQuery = isSharedMode ? sharedUserQuery : currentUserQuery

  // Adapt shared entries to FocusTimeEntry format
  const data = useMemo(() => {
    if (isSharedMode) {
      const sharedEntries = (sharedUserQuery.data ?? []) as SharedTimeEntry[]
      return sharedEntries.map(adaptSharedEntry)
    }
    return (currentUserQuery.data ?? []) as FocusTimeEntry[]
  }, [isSharedMode, sharedUserQuery.data, currentUserQuery.data])

  return {
    data,
    isLoading: activeQuery.isLoading,
    isFetching: activeQuery.isFetching,
    isError: activeQuery.isError,
    error: activeQuery.error,
  }
}
