'use client'

import { useEffect, useMemo, useState } from 'react'

import { useFilteredEntries, type ReportFilterState } from '@/features/reports/components/focus-filters'
import { FocusUpdatingOverlay } from '@/features/reports/components/focus-updating-overlay'
import { useFocusTimeEntriesRangeQuery } from '@/features/reports/hooks/use-focus-time-entries'
import {
  buildHourlyHistogram,
  formatExcludedNote,
  formatHourLabel,
  formatMinutesAsHoursTick,
} from '@/features/reports/utils/aggregation'
import { getPeriodRange } from '@/features/reports/utils/dates'
import type { FocusPeriod, FocusTimeEntry } from '@/features/reports/utils/types'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { cn, formatDuration } from '@/lib/utils'
import AnimateChangeInHeight from '@/components/animate-change-in-height'

const EMPTY_ENTRIES: FocusTimeEntry[] = []

interface FocusHourlyCardProps {
  view: FocusPeriod
  filters?: ReportFilterState
  explicitEntries?: FocusTimeEntry[]
  isLoading?: boolean
}

export function FocusHourlyCard({ view, filters, explicitEntries, isLoading: explicitLoading }: FocusHourlyCardProps) {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    setOffset(0)
  }, [view])

  const period = view

  const range = useMemo(() => getPeriodRange({ period, offset }), [period, offset])
  const entriesQuery = useFocusTimeEntriesRangeQuery({ startDate: range.startDate, endDate: range.endDate })
  
  const rawEntries = explicitEntries ?? entriesQuery.data ?? EMPTY_ENTRIES
  const entries = useFilteredEntries(rawEntries, filters ?? { goalIds: [], categoryIds: [] })
  
  const showLoading = (explicitLoading ?? entriesQuery.isLoading) && rawEntries.length === 0
  const showUpdating = (explicitLoading ?? entriesQuery.isFetching) && !showLoading

  const histogram = useMemo(() => buildHourlyHistogram(entries, range.days), [entries, range.days])
  const excludedNote = useMemo(
    () => formatExcludedNote(histogram.excludedMinutes, histogram.excludedEntries),
    [histogram.excludedMinutes, histogram.excludedEntries],
  )

  const totalIncludedMinutes = useMemo(() => histogram.data.reduce((sum, h) => sum + h.minutes, 0), [histogram.data])

  return (
    <div className="card-brutal">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold uppercase">Most Focused Hours</h2>
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
        ) : entries.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            <p className="font-mono uppercase">No time entries</p>
            <p className="text-sm">Log time with a start time to see hour distribution.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <div className="font-mono text-sm text-gray-600">Included</div>
              <div className="font-mono text-lg font-bold">{formatDuration(totalIncludedMinutes)}</div>
            </div>

            {excludedNote && <div className="text-sm text-gray-600">{excludedNote}</div>}

            <div className="relative h-72 w-full border-2 border-secondary bg-white p-2">
              <FocusUpdatingOverlay active={showUpdating} />
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogram.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" interval={1} tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => formatMinutesAsHoursTick(Number(v))} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => formatDuration(Number(value))}
                    labelFormatter={(label) => String(label)}
                  />
                  <Bar dataKey="minutes" fill="#FACC15" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="font-mono text-xs text-gray-500">X-axis is hour of day • Y-axis is focused time</div>
          </div>
        )}
      </AnimateChangeInHeight>
    </div>
  )
}
