'use client'

import { useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Clock, Layers, ChevronDown, ChevronRight } from 'lucide-react'

import { useFilteredEntries, type ReportFilterState } from '@/features/reports/components/focus-filters'
import { FocusUpdatingOverlay } from '@/features/reports/components/focus-updating-overlay'
import { useFocusTimeEntriesRangeQuery } from '@/features/reports/hooks/use-focus-time-entries'
import { getRollingRange } from '@/features/reports/utils/dates'
import type { FocusGranularity, FocusTimeEntry } from '@/features/reports/utils/types'

import { cn, formatDuration } from '@/lib/utils'

interface TaskTotal {
  taskKey: string
  taskName: string
  totalMinutes: number
  goalTitle: string | null
  goalColor: string | null
}

interface DayTotal {
  date: string
  dayOfWeek: string
  totalMinutes: number
  tasks: TaskTotal[]
}

function aggregateByTaskPerDay(entries: FocusTimeEntry[]): DayTotal[] {
  const dayMap = new Map<string, { tasks: Map<string, TaskTotal>; totalMinutes: number }>()
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  for (const entry of entries) {
    const dateKey = entry.date.split('T')[0]
    
    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, { tasks: new Map(), totalMinutes: 0 })
    }
    
    const day = dayMap.get(dateKey)!
    day.totalMinutes += entry.duration

    // Create a unique key for each task (by taskId if available, otherwise by normalized name)
    const taskKey = entry.taskId || entry.taskName.trim().toLowerCase()
    const taskName = entry.task?.title || entry.taskName

    if (!day.tasks.has(taskKey)) {
      day.tasks.set(taskKey, {
        taskKey,
        taskName,
        totalMinutes: 0,
        goalTitle: entry.goal?.title || null,
        goalColor: entry.goal?.color || null,
      })
    }

    const task = day.tasks.get(taskKey)!
    task.totalMinutes += entry.duration
  }

  // Convert to array and sort by date
  const result: DayTotal[] = []
  for (const [dateKey, data] of dayMap) {
    const date = parseISO(dateKey)
    result.push({
      date: dateKey,
      dayOfWeek: dayNames[date.getDay()],
      totalMinutes: data.totalMinutes,
      tasks: Array.from(data.tasks.values()).sort((a, b) => b.totalMinutes - a.totalMinutes),
    })
  }

  return result.sort((a, b) => a.date.localeCompare(b.date))
}

interface FocusTaskTotalCardProps {
  view: FocusGranularity
  filters?: ReportFilterState
}

export function FocusTaskTotalCard({ view, filters }: FocusTaskTotalCardProps) {
  const [offset, setOffset] = useState(0)
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())

  useEffect(() => {
    setOffset(0)
  }, [view])

  const range = useMemo(() => getRollingRange({ granularity: view, offset }), [view, offset])
  const entriesQuery = useFocusTimeEntriesRangeQuery({ startDate: range.startDate, endDate: range.endDate })
  const rawEntries = useMemo(() => entriesQuery.data ?? [], [entriesQuery.data])
  const entries = useFilteredEntries(rawEntries, filters ?? { goalIds: [], categoryIds: [] })
  const showLoading = entriesQuery.isLoading && rawEntries.length === 0
  const showUpdating = entriesQuery.isFetching && !showLoading

  const dailyTotals = useMemo(() => aggregateByTaskPerDay(entries), [entries])

  // Auto-expand all days when data loads
  useEffect(() => {
    if (dailyTotals.length > 0) {
      setExpandedDays(new Set(dailyTotals.map(d => d.date)))
    }
  }, [dailyTotals])

  const grandTotal = useMemo(() => dailyTotals.reduce((sum, d) => sum + d.totalMinutes, 0), [dailyTotals])
  const uniqueTaskCount = useMemo(() => {
    const allTasks = new Set<string>()
    dailyTotals.forEach(d => d.tasks.forEach(t => allTasks.add(t.taskKey)))
    return allTasks.size
  }, [dailyTotals])

  const toggleDay = (date: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev)
      if (next.has(date)) {
        next.delete(date)
      } else {
        next.add(date)
      }
      return next
    })
  }

  const expandAll = () => setExpandedDays(new Set(dailyTotals.map(d => d.date)))
  const collapseAll = () => setExpandedDays(new Set())

  return (
    <div className="card-brutal relative">
      {showUpdating && <FocusUpdatingOverlay active={showUpdating} />}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold uppercase">
            <Layers className="h-5 w-5" />
            Report by Task Total
          </h2>
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

      {showLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
        </div>
      ) : dailyTotals.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-center">
          <Clock className="mb-4 h-12 w-12 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-600">No time entries found</h3>
          <p className="text-sm text-gray-500">Try adjusting your date range</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border-2 border-secondary bg-white p-3 text-center">
              <div className="text-xs font-medium uppercase text-gray-500">Total Time</div>
              <div className="text-xl font-bold">{formatDuration(grandTotal)}</div>
            </div>
            <div className="rounded-lg border-2 border-secondary bg-white p-3 text-center">
              <div className="text-xs font-medium uppercase text-gray-500">Unique Tasks</div>
              <div className="text-xl font-bold">{uniqueTaskCount}</div>
            </div>
            <div className="rounded-lg border-2 border-secondary bg-white p-3 text-center">
              <div className="text-xs font-medium uppercase text-gray-500">Days Worked</div>
              <div className="text-xl font-bold">{dailyTotals.length}</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button type="button" onClick={expandAll} className="btn-brutal-secondary px-3 py-1 text-xs">
              Expand All
            </button>
            <button type="button" onClick={collapseAll} className="btn-brutal-secondary px-3 py-1 text-xs">
              Collapse All
            </button>
          </div>

          {/* Daily Breakdown */}
          <div className="overflow-hidden rounded-lg border-3 border-secondary bg-white">
            {dailyTotals.map((day) => (
              <div key={day.date} className="border-b border-gray-200 last:border-b-0">
                {/* Day Header */}
                <button
                  type="button"
                  onClick={() => toggleDay(day.date)}
                  className="flex w-full items-center gap-2 bg-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-200"
                >
                  {expandedDays.has(day.date) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span className="font-semibold">
                    {format(parseISO(day.date), 'EEEE, MMM d')}
                  </span>
                  <span className="ml-auto font-mono text-sm">
                    {day.tasks.length} {day.tasks.length === 1 ? 'task' : 'tasks'} •{' '}
                    <span className="font-semibold text-secondary">{formatDuration(day.totalMinutes)}</span>
                  </span>
                </button>

                {/* Task List */}
                {expandedDays.has(day.date) && (
                  <div className="divide-y divide-gray-100">
                    {day.tasks.map((task) => (
                      <div
                        key={task.taskKey}
                        className="flex items-center gap-3 px-4 py-2 pl-10 transition-colors hover:bg-gray-50"
                      >
                        {task.goalColor && (
                          <span
                            className="h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: task.goalColor }}
                          />
                        )}
                        <div className="flex-1 truncate">
                          <span className="font-medium">{task.taskName}</span>
                          {task.goalTitle && (
                            <span className="ml-2 text-xs font-semibold text-gray-700">({task.goalTitle})</span>
                          )}
                        </div>
                        <span className="font-mono text-sm font-semibold text-secondary">
                          {formatDuration(task.totalMinutes)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Grand Total */}
            <div className="flex items-center justify-end gap-4 border-t-3 border-secondary bg-secondary px-4 py-3 text-white">
              <span className="font-semibold uppercase">Grand Total:</span>
              <span className="text-xl font-bold">{formatDuration(grandTotal)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
