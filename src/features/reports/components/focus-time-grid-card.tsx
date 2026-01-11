'use client'

import { useEffect, useMemo, useState } from 'react'

import { useFilteredEntries, type ReportFilterState } from '@/features/reports/components/focus-filters'
import { FocusUpdatingOverlay } from '@/features/reports/components/focus-updating-overlay'
import { useFocusTimeEntriesRangeQuery } from '@/features/reports/hooks/use-focus-time-entries'
import { buildTimeGrid, formatExcludedNote, formatHourLabel } from '@/features/reports/utils/aggregation'
import { getPeriodRange } from '@/features/reports/utils/dates'
import type { FocusPeriod, FocusTimeEntry } from '@/features/reports/utils/types'
import { format, parseISO } from 'date-fns'

import { cn, formatDuration } from '@/lib/utils'
import AnimateChangeInHeight from '@/components/animate-change-in-height'

const EMPTY_ENTRIES: FocusTimeEntry[] = []

function getOpacity(minutes: number): number {
  if (minutes <= 0) return 0
  if (minutes <= 20) return 0.4
  if (minutes <= 40) return 0.7
  return 1.0
}

function getFallbackClass(minutes: number): string {
  if (minutes <= 0) return 'bg-slate-50'
  if (minutes <= 20) return 'bg-sky-200'
  if (minutes <= 40) return 'bg-sky-400'
  return 'bg-sky-600'
}

interface FocusTimeGridCardProps {
  view: FocusPeriod
  filters?: ReportFilterState
  explicitEntries?: FocusTimeEntry[]
  isLoading?: boolean
}

export function FocusTimeGridCard({ view, filters, explicitEntries, isLoading: explicitLoading }: FocusTimeGridCardProps) {
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

  const gridResult = useMemo(() => buildTimeGrid(entries, range.days), [entries, range.days])
  const excludedNote = useMemo(
    () => formatExcludedNote(gridResult.excludedMinutes, gridResult.excludedEntries),
    [gridResult.excludedMinutes, gridResult.excludedEntries],
  )

  const totalIncludedMinutes = useMemo(
    () => Object.values(gridResult.grid).reduce((sum, cells) => sum + cells.reduce((a, b) => a + b.totalMinutes, 0), 0),
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
              <span className="font-mono text-gray-500">OPACITY:</span>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-[2px] border border-secondary bg-black/40" />
                <span className="font-mono uppercase">1–20m</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-[2px] border border-secondary bg-black/70" />
                <span className="font-mono uppercase">21–40m</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-[2px] border border-secondary bg-black" />
                <span className="font-mono uppercase">41m+</span>
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
                      {period === 'month' ? format(parseISO(day), 'd') : format(parseISO(day), 'EEE')}
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
                        const cell = gridResult.grid[day]?.[hour]
                        const minutes = cell?.totalMinutes ?? 0
                        const items = cell?.items ?? []
                        
                        const dominantItem = items.length > 0 ? items[0] : undefined
                        const dominantColor = dominantItem?.goalColor
                        const taskName = dominantItem?.taskName
                        
                        // Build tooltip text
                        let tooltip = `${format(parseISO(day), 'MMM d')} • ${formatHourLabel(hour)}`
                        if (minutes > 0) {
                          tooltip += ` • ${formatDuration(minutes)}\n`
                          tooltip += items.map(i => `• ${i.taskName} (${formatDuration(i.minutes)})`).join('\n')
                        }

                        return (
                          <div
                            key={day}
                            title={tooltip}
                            className={cn(
                              'group relative h-12 w-full rounded-[2px] transition-all hover:z-10',
                            )}
                          >
                             {/* Background Layer to handle Opacity independently of content */}
                             <div 
                                className={cn(
                                  "absolute inset-0 rounded-[2px] transition-all group-hover:brightness-95 group-hover:scale-105", 
                                  !dominantColor && getFallbackClass(minutes)
                                )}
                                style={dominantColor ? { backgroundColor: dominantColor, opacity: getOpacity(minutes) } : undefined}
                             />

                             {/* Content Layer - always readable */}
                             {minutes > 0 && (
                               <div className="pointer-events-none relative z-10 flex h-full flex-col justify-center overflow-hidden px-1 text-[10px] leading-none text-slate-900 mix-blend-multiply opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-100">
                                  <span className="truncate font-semibold">{taskName}</span>
                                  {items.length > 1 && <span className="text-[9px]">+ {items.length - 1} more</span>}
                                  <span className="mt-0.5 opacity-75">{formatDuration(minutes)}</span>
                               </div>
                             )}
                          </div>
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
