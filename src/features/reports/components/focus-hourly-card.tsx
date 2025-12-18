'use client'

import { useMemo, useState } from 'react'

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import AnimateChangeInHeight from '@/components/animate-change-in-height'

const PERIOD_OPTIONS: Array<{ value: FocusPeriod; label: string }> = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
]

const EMPTY_ENTRIES: FocusTimeEntry[] = []

export function FocusHourlyCard() {
  const [period, setPeriod] = useState<FocusPeriod>('week')
  const [offset, setOffset] = useState(0)

  const range = useMemo(() => getPeriodRange({ period, offset }), [period, offset])
  const entriesQuery = useFocusTimeEntriesRangeQuery({ startDate: range.startDate, endDate: range.endDate })
  const entries = entriesQuery.data ?? EMPTY_ENTRIES
  const showLoading = entriesQuery.isLoading && entries.length === 0
  const showUpdating = entriesQuery.isFetching && !showLoading

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

          <Select
            value={period}
            onValueChange={(v) => {
              setPeriod(v as FocusPeriod)
              setOffset(0)
            }}
          >
            <SelectTrigger className="h-10 w-[140px] border-3 border-secondary">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
