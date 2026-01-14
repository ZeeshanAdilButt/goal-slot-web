import { useMemo, useState } from 'react'

import { useDeleteTimeEntry } from '@/features/time-tracker/hooks/use-time-tracker-mutations'
import { TimeEntry } from '@/features/time-tracker/utils/types'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CalendarRange, Clock, History, Target, Trash2 } from 'lucide-react'

import { timeEntriesApi } from '@/lib/api'
import { formatDate, formatDuration } from '@/lib/utils'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { GoalSlotSpinner } from '@/components/goalslot-logo'

export function RecentEntries() {
  const deleteEntry = useDeleteTimeEntry()
  const [entryToDelete, setEntryToDelete] = useState<TimeEntry | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const recentQuery = useQuery({
    queryKey: ['time-tracker', 'recent-entries', 'paged', page, pageSize, startDate, endDate],
    queryFn: async () => {
      const res = await timeEntriesApi.getRecent({
        page,
        pageSize,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })

      const data = res.data as any
      if (Array.isArray(data)) {
        return { items: data, total: data.length, page, pageSize, hasNextPage: false }
      }
      return data
    },
    placeholderData: (previousData) => previousData,
  })

  const entries: TimeEntry[] = recentQuery.data?.items || []
  const total = recentQuery.data?.total || 0
  const hasNext = recentQuery.data?.hasNextPage ?? entries.length === pageSize
  const totalPages = useMemo(() => (pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1), [total, pageSize])

  const handleConfirmDelete = async () => {
    if (!entryToDelete || deleteEntry.isPending) return
    await deleteEntry.mutateAsync(entryToDelete.id)
    setEntryToDelete(null)
  }

  const handlePageChange = (direction: 'prev' | 'next') => {
    setPage((p) => {
      if (direction === 'prev') return Math.max(1, p - 1)
      if (!hasNext) return p
      return p + 1
    })
  }

  const showingFrom = total === 0 ? 0 : (page - 1) * pageSize + 1
  const showingTo = Math.min(page * pageSize, total)

  const hasFilters = !!(startDate || endDate)

  return (
    <div className="card-brutal">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold uppercase sm:mb-6 sm:text-xl md:text-2xl">
        <History className="h-5 w-5 sm:h-6 sm:w-6" />
        <span className="hidden sm:inline">Recent Time Entries</span>
        <span className="sm:hidden">Recent Entries</span>
      </h2>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border-2 border-secondary bg-white p-3 text-xs sm:text-sm">
        <div className="flex items-center gap-1">
          <span className="font-mono uppercase text-gray-700">From</span>
          <input
            type="date"
            className="border-2 border-secondary px-2 py-1"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="font-mono uppercase text-gray-700">To</span>
          <input
            type="date"
            className="border-2 border-secondary px-2 py-1"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <button
          type="button"
          className="btn-brutal-secondary px-3 py-1 text-xs"
          onClick={() => {
            setStartDate('')
            setEndDate('')
            setPage(1)
          }}
          disabled={(!startDate && !endDate) || recentQuery.isFetching}
        >
          Clear filters
        </button>
      </div>

      {recentQuery.isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <GoalSlotSpinner size="md" />
        </div>
      ) : entries.length === 0 ? (
        <div className="py-6 text-center text-gray-500 sm:py-8">
          <Clock className="mx-auto mb-3 h-10 w-10 opacity-50 sm:mb-4 sm:h-12 sm:w-12" />
          <p className="font-mono text-sm uppercase sm:text-base">
            {hasFilters ? 'No entries found' : 'No entries yet'}
          </p>
          <p className="text-xs sm:text-sm">
            {hasFilters ? 'Try adjusting your filters' : 'Start tracking your time!'}
          </p>
          {hasFilters && (
            <button
              type="button"
              className="btn-brutal mt-4 px-4 py-2 text-xs"
              onClick={() => {
                setStartDate('')
                setEndDate('')
                setPage(1)
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          <div className="flex flex-col gap-2 rounded-md border-2 border-secondary bg-brutalist-bg p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase text-gray-700">
              <CalendarRange className="h-4 w-4" />
              <span>
                Showing {showingFrom}-{showingTo} of {total}
              </span>
              {startDate && <span className="badge-brutal">From {startDate}</span>}
              {endDate && <span className="badge-brutal">To {endDate}</span>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="btn-brutal-secondary px-3 py-1 text-xs"
                onClick={() => handlePageChange('prev')}
                disabled={page === 1 || recentQuery.isFetching}
              >
                Prev
              </button>
              <button
                type="button"
                className="btn-brutal-secondary px-3 py-1 text-xs"
                onClick={() => handlePageChange('next')}
                disabled={!hasNext || recentQuery.isFetching}
              >
                Next
              </button>
              <span className="font-mono text-xs text-gray-600">
                Page {page} / {totalPages}
              </span>
              <select
                className="border-2 border-secondary px-2 py-1 text-xs"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
            </div>
          </div>

          {entries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 border-2 border-secondary bg-white p-3 transition-all hover:shadow-brutal sm:gap-4 sm:p-4"
            >
              <div className="h-2 w-2 shrink-0 rounded-full bg-primary sm:h-3 sm:w-3" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold sm:text-base">{entry.taskName}</div>
                <div className="flex items-center gap-1.5 truncate font-mono text-xs text-gray-500">
                  {entry.goal && (
                    <>
                      <Target className="h-3 w-3 shrink-0" />
                      <span>{entry.goal.title}</span>
                    </>
                  )}
                  {entry.notes && (
                    <>
                      {entry.goal && <span>•</span>}
                      <span>{entry.notes}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3 sm:gap-4">
                <div className="text-right">
                  <div className="font-mono text-sm font-bold sm:text-base">{formatDuration(entry.duration)}</div>
                  <div className="font-mono text-xs text-gray-500">{formatDate(entry.date)}</div>
                </div>
                <button
                  type="button"
                  className="rounded-sm border-2 border-red-300 bg-white p-1.5 shadow-brutal-sm transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal"
                  onClick={() => setEntryToDelete(entry)}
                  disabled={deleteEntry.isPending}
                  title="Delete entry"
                  aria-label="Delete entry"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-600" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!entryToDelete}
        onOpenChange={(open) => {
          if (!open) setEntryToDelete(null)
        }}
        title="Delete time entry?"
        description="This will remove the time entry and update your stats."
        onConfirm={handleConfirmDelete}
        onCancel={() => setEntryToDelete(null)}
        confirmButtonText="Delete"
        cancelButtonText="Keep entry"
        variant="destructive"
        isLoading={deleteEntry.isPending}
      />
    </div>
  )
}
