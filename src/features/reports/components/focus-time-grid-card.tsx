'use client'

import { useMemo, useState } from 'react'

import { FocusUpdatingOverlay } from '@/features/reports/components/focus-updating-overlay'
import { useFocusTimeEntriesRangeQuery } from '@/features/reports/hooks/use-focus-time-entries'
import { buildTimeGrid, formatExcludedNote, formatHourLabel } from '@/features/reports/utils/aggregation'
import { getPeriodRange } from '@/features/reports/utils/dates'
import type { FocusPeriod, FocusTimeEntry } from '@/features/reports/utils/types'
import { format, parseISO } from 'date-fns'

import { cn, formatDuration } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import AnimateChangeInHeight from '@/components/animate-change-in-height'

const PERIOD_OPTIONS: Array<{ value: FocusPeriod; label: string }> = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
]

const EMPTY_ENTRIES: FocusTimeEntry[] = []

function getIntensityClass(minutes: number): string {
  if (minutes <= 0) return 'bg-slate-50'
  if (minutes <= 20) return 'bg-sky-200'
  if (minutes <= 40) return 'bg-sky-400'
  return 'bg-sky-600'
}

export function FocusTimeGridCard() {
  const [period, setPeriod] = useState<FocusPeriod>('week')
  const [offset, setOffset] = useState(0)

  const range = useMemo(() => getPeriodRange({ period, offset }), [period, offset])
  const entriesQuery = useFocusTimeEntriesRangeQuery({ startDate: range.startDate, endDate: range.endDate })
  const entries = entriesQuery.data ?? EMPTY_ENTRIES
  const showLoading = entriesQuery.isLoading && entries.length === 0
  const showUpdating = entriesQuery.isFetching && !showLoading

  const gridResult = useMemo(() => buildTimeGrid(entries, range.days), [entries, range.days])
  const excludedNote = useMemo(
    () => formatExcludedNote(gridResult.excludedMinutes, gridResult.excludedEntries),
    [gridResult.excludedMinutes, gridResult.excludedEntries],
  )

  const totalIncludedMinutes = useMemo(
    () => Object.values(gridResult.grid).reduce((sum, hours) => sum + hours.reduce((a, b) => a + b, 0), 0),
    [gridResult.grid],
  )

  const hours = useMemo(() => Array.from({ length: 24 }, (_, hour) => hour), [])

  return (
    <div className="card-brutal">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold uppercase">Time Grid</h2>
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
            <p className="text-sm">Log time with a start time to see your grid.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <div className="font-mono text-sm text-gray-600">Included</div>
              <div className="font-mono text-lg font-bold">{formatDuration(totalIncludedMinutes)}</div>
            </div>

            {excludedNote && <div className="text-sm text-gray-600">{excludedNote}</div>}

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-[2px] border border-secondary bg-sky-200" />
                <span className="font-mono uppercase">1–20m</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-[2px] border border-secondary bg-sky-400" />
                <span className="font-mono uppercase">21–40m</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-[2px] border border-secondary bg-sky-600" />
                <span className="font-mono uppercase">41–60m+</span>
              </div>
            </div>

            <div
              className={cn(
                'relative overflow-x-auto border-2 border-secondary bg-white p-2',
                // Let the card grow and use page scrolling (inner Y-scroll felt cramped in month view).
                period === 'month' && 'overflow-y-visible',
              )}
            >
              <FocusUpdatingOverlay active={showUpdating} />

              <div className="min-w-[720px]">
                {/* X-axis (days), Y-axis (hours) */}
                <div
                  className="grid gap-px rounded-sm bg-secondary/20 p-px"
                  style={{ gridTemplateColumns: `92px repeat(${range.days.length}, minmax(0, 1fr))` }}
                >
                  <div className="bg-white" />
                  {range.days.map((day) => (
                    <div key={day} className="bg-white py-1 text-center font-mono text-[10px] text-gray-500">
                      {period === 'week' ? format(parseISO(day), 'EEE') : format(parseISO(day), 'd')}
                    </div>
                  ))}
                </div>

                <div className="mt-2 space-y-px rounded-sm bg-secondary/20 p-px">
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="grid items-center gap-px"
                      style={{ gridTemplateColumns: `92px repeat(${range.days.length}, minmax(0, 1fr))` }}
                    >
                      <div className="bg-white pr-2 text-right font-mono text-[10px] text-gray-600">
                        {formatHourLabel(hour)}
                      </div>
                      {range.days.map((day) => {
                        const minutes = gridResult.grid[day]?.[hour] ?? 0
                        return (
                          <div
                            key={day}
                            title={`${format(parseISO(day), 'MMM d')} • ${formatHourLabel(hour)} • ${formatDuration(minutes)}`}
                            className={cn(
                              'h-4 rounded-[2px] transition-colors hover:brightness-95',
                              getIntensityClass(minutes),
                            )}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimateChangeInHeight>
    </div>
  )
}
