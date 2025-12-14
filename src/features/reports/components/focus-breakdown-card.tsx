'use client'

import { useMemo, useState } from 'react'

import { FocusUpdatingOverlay } from '@/features/reports/components/focus-updating-overlay'
import { useFocusTimeEntriesRangeQuery } from '@/features/reports/hooks/use-focus-time-entries'
import { buildStackedSeries, formatMinutesAsHoursTick } from '@/features/reports/utils/aggregation'
import { getRollingRange } from '@/features/reports/utils/dates'
import type { FocusGranularity, FocusGroupBy } from '@/features/reports/utils/types'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { cn, formatDuration } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import AnimateChangeInHeight from '@/components/animate-change-in-height'

const GRANULARITY_OPTIONS: Array<{ value: FocusGranularity; label: string }> = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
]

const GROUP_BY_OPTIONS: Array<{ value: FocusGroupBy; label: string }> = [
  { value: 'goal', label: 'Goal' },
  { value: 'task', label: 'Task' },
]

export function FocusBreakdownCard() {
  const [groupBy, setGroupBy] = useState<FocusGroupBy>('goal')
  const [granularity, setGranularity] = useState<FocusGranularity>('week')
  const [offset, setOffset] = useState(0)

  const range = useMemo(() => getRollingRange({ granularity, offset }), [granularity, offset])
  const entriesQuery = useFocusTimeEntriesRangeQuery({ startDate: range.startDate, endDate: range.endDate })
  const entries = entriesQuery.data ?? []
  const showLoading = entriesQuery.isLoading && entries.length === 0
  const showUpdating = entriesQuery.isFetching && !showLoading

  const series = useMemo(() => {
    const entries = entriesQuery.data ?? []
    const topN = groupBy === 'task' ? 8 : 6
    return buildStackedSeries({
      entries,
      granularity,
      groupBy,
      topN,
      startDate: range.startDate,
      endDate: range.endDate,
    })
  }, [entriesQuery, granularity, groupBy, range])

  const stackLabelByKey = useMemo(() => Object.fromEntries(series.stacks.map((s) => [s.key, s.label])), [series.stacks])

  return (
    <div className="card-brutal">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold uppercase">Focus Breakdown</h2>
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

          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as FocusGroupBy)}>
            <SelectTrigger className="h-10 w-[140px] border-3 border-secondary">
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              {GROUP_BY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={granularity}
            onValueChange={(v) => {
              setGranularity(v as FocusGranularity)
              setOffset(0)
            }}
          >
            <SelectTrigger className="h-10 w-[140px] border-3 border-secondary">
              <SelectValue placeholder="Granularity" />
            </SelectTrigger>
            <SelectContent>
              {GRANULARITY_OPTIONS.map((opt) => (
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
        ) : series.totalMinutes === 0 ? (
          <div className="py-10 text-center text-gray-500">
            <p className="font-mono uppercase">No time entries</p>
            <p className="text-sm">Log time to see your focus breakdown.</p>
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
                <BarChart data={series.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bucketLabel" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => formatMinutesAsHoursTick(Number(v))} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value, name) => [
                      formatDuration(Number(value)),
                      stackLabelByKey[String(name)] || String(name),
                    ]}
                    labelFormatter={(label) => String(label)}
                  />
                  {series.stacks.map((stack) => (
                    <Bar key={stack.key} dataKey={stack.key} stackId="a" fill={stack.color} isAnimationActive={false} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap gap-3">
              {series.stacks.map((s) => (
                <div key={s.key} className="flex items-center gap-2">
                  <div className="h-3 w-3 border border-secondary" style={{ backgroundColor: s.color }} />
                  <span className="font-mono text-xs uppercase text-gray-700">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </AnimateChangeInHeight>
    </div>
  )
}
