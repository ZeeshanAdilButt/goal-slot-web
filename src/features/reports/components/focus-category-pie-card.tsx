'use client'

import { useEffect, useMemo, useState } from 'react'

import { useFilteredEntries, type ReportFilterState } from '@/features/reports/components/focus-filters'
import { FocusUpdatingOverlay } from '@/features/reports/components/focus-updating-overlay'
import { useFocusTimeEntriesRangeQuery } from '@/features/reports/hooks/use-focus-time-entries'
import { getPeriodRange } from '@/features/reports/utils/dates'
import type { FocusGranularity } from '@/features/reports/utils/types'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { cn, formatDuration } from '@/lib/utils'
import AnimateChangeInHeight from '@/components/animate-change-in-height'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1']

interface FocusCategoryPieCardProps {
  view: FocusGranularity
  filters?: ReportFilterState
}

export function FocusCategoryPieCard({ view, filters }: FocusCategoryPieCardProps) {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    setOffset(0)
  }, [view])

  const granularity = view

  const range = useMemo(() => getPeriodRange({ period: granularity, offset }), [granularity, offset])
  const entriesQuery = useFocusTimeEntriesRangeQuery({ startDate: range.startDate, endDate: range.endDate })
  const rawEntries = entriesQuery.data || []
  const entries = useFilteredEntries(rawEntries, filters ?? { goalIds: [], categoryIds: [] })

  const data = useMemo(() => {
    const categoryMap = new Map<string, number>()

    entries.forEach((entry) => {
      const rawCategory =
        entry.task?.category || entry.scheduleBlock?.category || entry.goal?.category || 'Uncategorized'
      // Normalize category name (e.g. DEEP_WORK -> Deep Work)
      const category = rawCategory
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')

      const duration = entry.duration || 0
      categoryMap.set(category, (categoryMap.get(category) || 0) + duration)
    })

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [entries])

  const showLoading = entriesQuery.isLoading && rawEntries.length === 0
  const showUpdating = entriesQuery.isFetching && !showLoading

  return (
    <div className="card-brutal">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold uppercase">Time by Category</h2>
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
          <div className="flex h-[300px] items-center justify-center">
            <div className="h-10 w-10 animate-spin border-4 border-secondary border-t-primary" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-[300px] flex-col items-center justify-center text-gray-500">
            <p className="font-mono uppercase">No data</p>
            <p className="text-sm">No time entries found for this period.</p>
          </div>
        ) : (
          <div className="relative h-[300px] w-full">
            <FocusUpdatingOverlay active={showUpdating} />
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value">
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatDuration(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </AnimateChangeInHeight>
    </div>
  )
}
