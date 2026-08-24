'use client'

import { useEffect, useMemo, useState } from 'react'

import { useFilteredEntries, type ReportFilterState } from '@/features/reports/components/focus-filters'
import { FocusUpdatingOverlay } from '@/features/reports/components/focus-updating-overlay'
import { useReportTimeEntries } from '@/features/reports/hooks/use-report-time-entries'
import { buildTimeGrid, formatExcludedNote, formatHourLabel } from '@/features/reports/utils/aggregation'
import { getPeriodRange } from '@/features/reports/utils/dates'
import type { FocusPeriod, FocusTimeEntry } from '@/features/reports/utils/types'
import { format, parseISO } from 'date-fns'

import { cn, formatDuration } from '@/lib/utils'
import { Loading } from '@/components/ui/loading'
import AnimateChangeInHeight from '@/components/animate-change-in-height'

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
  reportUserId?: string
}

export function FocusTimeGridCard({ view, filters, reportUserId }: FocusTimeGridCardProps) {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    setOffset(0)
  }, [view])

  const period = view

  const range = useMemo(() => getPeriodRange({ period, offset }), [period, offset])
  const {
    data: rawEntries,
    isLoading,
    isFetching,
  } = useReportTimeEntries({
    startDate: range.startDate,
    endDate: range.endDate,
    reportUserId,
  })

  const entries = useFilteredEntries(rawEntries, filters ?? { goalIds: [], categoryIds: [] })

  const showLoading = isLoading && rawEntries.length === 0
  const showUpdating = isFetching && !showLoading

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
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold uppercase">Time Grid</h2>
          <div className="font-mono text-xs text-gray-600">{range.label}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOffset((o) => o - 1)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 px-4 py-2 text-sm text-xs font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setOffset((o) => Math.min(o + 1, 0))}
            disabled={offset >= 0}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 text-xs font-semibold px-3 py-2 transition-colors hover:bg-zinc-50',
              offset >= 0 && 'opacity-50',
            )}
          >
            Next
          </button>
        </div>
      </div>

      <AnimateChangeInHeight>
        {showLoading ? (
          <div className="flex h-72 items-center justify-center">
            <Loading size="md" />
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
              <span className="font-mono text-zinc-500">INTENSITY:</span>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-[2px] border border-zinc-200 bg-sky-200" />
                <span className="font-mono uppercase text-zinc-600">1-20m</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-[2px] border border-zinc-200 bg-sky-400" />
                <span className="font-mono uppercase text-zinc-600">21-40m</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-[2px] border border-zinc-200 bg-sky-600" />
                <span className="font-mono uppercase text-zinc-600">41m+</span>
              </div>
              <span className="ml-auto font-mono text-[10px] text-zinc-400">
                {period === 'month' ? 'Hover a cell for detail' : 'Goal colors override the intensity ramp'}
              </span>
            </div>

            <div
              className={cn(
                'relative overflow-x-auto border border-zinc-200 bg-white p-2',
                // Let the card grow and use page scrolling (inner Y-scroll felt cramped in month view).
                period === 'month' && 'overflow-y-visible',
              )}
            >
              <FocusUpdatingOverlay active={showUpdating} />

              <div className={cn('min-w-[720px]', period === 'month' && 'min-w-[960px]')}>
                {/* X-axis (days), Y-axis (hours) */}
                <div
                  className="grid gap-px rounded-sm bg-zinc-200/60 p-px"
                  style={{ gridTemplateColumns: `92px repeat(${range.days.length}, minmax(0, 1fr))` }}
                >
                  <div className="bg-white" />
                  {range.days.map((day) => (
                    <div key={day} className="bg-white py-1 text-center font-mono text-[10px] text-zinc-500">
                      {period === 'month' ? format(parseISO(day), 'd') : format(parseISO(day), 'EEE')}
                    </div>
                  ))}
                </div>

                <div className="mt-2 space-y-px rounded-sm bg-zinc-200/60 p-px">
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="grid items-center gap-px"
                      style={{ gridTemplateColumns: `92px repeat(${range.days.length}, minmax(0, 1fr))` }}
                    >
                      <div className="bg-white pr-2 text-right font-mono text-[10px] text-zinc-600">
                        {formatHourLabel(hour)}
                      </div>
                      {range.days.map((day) => {
                        const cell = gridResult.grid[day]?.[hour]
                        const minutes = cell?.totalMinutes ?? 0
                        const items = cell?.items ?? []

                        const dominantItem = items.length > 0 ? items[0] : undefined
                        const dominantColor = dominantItem?.goalColor
                        const taskName = dominantItem?.taskName

                        const isMonth = period === 'month'

                        return (
                          <div
                            key={day}
                            className={cn('group relative h-12 w-full rounded-[2px] transition-all hover:z-20')}
                          >
                            {/* Background, colored by dominant goal OR sky-intensity fallback */}
                            <div
                              className={cn(
                                'absolute inset-0 rounded-[2px] transition-[transform,filter] duration-150 group-hover:brightness-95 group-hover:scale-[1.04]',
                                !dominantColor && getFallbackClass(minutes),
                              )}
                              style={
                                dominantColor
                                  ? { backgroundColor: dominantColor, opacity: getOpacity(minutes) }
                                  : undefined
                              }
                            />

                            {/* Inline text — only on >=week views (cells wide enough) */}
                            {minutes > 0 && !isMonth && (
                              <div className="pointer-events-none relative z-10 flex h-full flex-col justify-center overflow-hidden px-1 text-[10px] leading-none text-slate-900 mix-blend-multiply">
                                <span className="truncate font-semibold">{taskName}</span>
                                {items.length > 1 && <span className="text-xs">+ {items.length - 1} more</span>}
                                <span className="mt-0.5 opacity-75">{formatDuration(minutes)}</span>
                              </div>
                            )}

                            {/* Hover card — full detail, works in every view but essential in month */}
                            {minutes > 0 && (
                              <div className="pointer-events-none invisible absolute left-1/2 top-full z-40 mt-1 w-56 -translate-x-1/2 rounded-lg border border-zinc-200 bg-white p-3 text-left opacity-0 shadow-lg transition-opacity duration-100 group-hover:visible group-hover:opacity-100">
                                <div className="mb-1 flex items-baseline justify-between gap-2">
                                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                                    {format(parseISO(day), 'MMM d')} - {formatHourLabel(hour)}
                                  </span>
                                  <span className="font-mono text-xs font-semibold text-zinc-900">
                                    {formatDuration(minutes)}
                                  </span>
                                </div>
                                <ul className="space-y-1 text-xs text-zinc-700">
                                  {items.slice(0, 5).map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-1.5">
                                      <span
                                        className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                                        style={{ backgroundColor: item.goalColor || '#94a3b8' }}
                                      />
                                      <span className="min-w-0 flex-1 truncate font-medium">{item.taskName}</span>
                                      <span className="shrink-0 font-mono text-[10px] text-zinc-500">
                                        {formatDuration(item.minutes)}
                                      </span>
                                    </li>
                                  ))}
                                  {items.length > 5 && (
                                    <li className="font-mono text-[10px] text-zinc-400">+ {items.length - 5} more</li>
                                  )}
                                </ul>
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
