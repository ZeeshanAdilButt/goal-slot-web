'use client'

import { useEffect, useMemo, useState } from 'react'

import { useFilteredEntries, type ReportFilterState } from '@/features/reports/components/focus-filters'
import { FocusUpdatingOverlay } from '@/features/reports/components/focus-updating-overlay'
import { useFocusTimeEntriesRangeQuery } from '@/features/reports/hooks/use-focus-time-entries'
import { buildTrendSeries, formatMinutesAsHoursTick } from '@/features/reports/utils/aggregation'
import { getRollingRange } from '@/features/reports/utils/dates'
import type { FocusGranularity } from '@/features/reports/utils/types'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { cn, formatDuration } from '@/lib/utils'
import AnimateChangeInHeight from '@/components/animate-change-in-height'

interface FocusTrendCardProps {
  view: FocusGranularity
  filters?: ReportFilterState
}

export function FocusTrendCard({ view, filters }: FocusTrendCardProps) {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    setOffset(0)
  }, [view])

  const granularity = view

  const range = useMemo(() => getRollingRange({ granularity, offset }), [granularity, offset])
  const entriesQuery = useFocusTimeEntriesRangeQuery({ startDate: range.startDate, endDate: range.endDate })
  const rawEntries = entriesQuery.data ?? []
  const entries = useFilteredEntries(rawEntries, filters ?? { goalIds: [], categoryIds: [] })
  const showLoading = entriesQuery.isLoading && rawEntries.length === 0
  const showUpdating = entriesQuery.isFetching && !showLoading

  const series = useMemo(() => {
    return buildTrendSeries({ entries, granularity, startDate: range.startDate, endDate: range.endDate })
  }, [entries, granularity, range])

  return (
    <div className="card-brutal">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold uppercase">Focus Trend</h2>
          <div className="font-mono text-xs text-gray-600">{range.label}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOffset((o) => o - 1)}
            className="btn-brutal-secondary px-3 py-2 text-xs"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setOffset((o) => Math.min(o + 1, 0))}
            disabled={offset >= 0}
            className={cn('btn-brutal-secondary px-3 py-2 text-xs', offset >= 0 && 'opacity-50')}
          >
            Next
          </button>
        </div>
      </div>

      <AnimateChangeInHeight>
        {showLoading ? (
          <div className="flex h-72 items-center justify-center">
            <div className="h-10 w-10 animate-spin border-4 border-secondary border-t-primary" />
          </div>
        ) : series.totalMinutes === 0 ? (
          <div className="py-10 text-center text-gray-500">
            <p className="font-mono uppercase">No time entries</p>
            <p className="text-sm">Log time to see your focus trend.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <div className="font-mono text-sm text-gray-600">Total</div>
              <div className="font-mono text-lg font-bold">{formatDuration(series.totalMinutes)}</div>
            </div>

            <div className="relative h-72 w-full border-2 border-secondary bg-white p-2">
              <FocusUpdatingOverlay active={showUpdating} />
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bucketLabel" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => formatMinutesAsHoursTick(Number(v))} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => formatDuration(Number(value))}
                    labelFormatter={(label) => String(label)}
                  />
                  <Line type="monotone" dataKey="minutes" stroke="#000" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </AnimateChangeInHeight>
    </div>
  )
}
