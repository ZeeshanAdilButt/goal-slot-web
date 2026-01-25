'use client'

import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ChevronDown, ChevronRight, Clock, FileText, Calendar } from 'lucide-react'

import type { DailyBreakdown, DetailedTimeEntry } from '@/features/reports/utils/types'
import { cn, formatDuration } from '@/lib/utils'

interface DetailedReportViewProps {
  dailyBreakdown: DailyBreakdown[]
  summary: {
    totalMinutes: number
    totalFormatted: string
    totalHours: number
    totalEntries: number
    daysWithEntries: number
    avgMinutesPerDay: number
  }
  billable?: {
    hourlyRate: number
    totalHours: number
    totalAmount: number
    currency: string
  } | null
  showBillable?: boolean
  showScheduleContext?: boolean
  includeTaskNotes?: boolean
}

export function DetailedReportView({
  dailyBreakdown,
  summary,
  billable,
  showBillable = false,
  showScheduleContext = false,
  includeTaskNotes = false,
}: DetailedReportViewProps) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set(dailyBreakdown.map((d) => d.date)))

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

  const expandAll = () => {
    setExpandedDays(new Set(dailyBreakdown.map((d) => d.date)))
  }

  const collapseAll = () => {
    setExpandedDays(new Set())
  }

  if (dailyBreakdown.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Calendar className="mb-4 h-12 w-12 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-600">No time entries found</h3>
        <p className="text-sm text-gray-500">Try adjusting your date range or filters</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border-2 border-secondary bg-white p-3">
          <div className="text-xs font-medium uppercase text-gray-500">Total Time</div>
          <div className="text-xl font-bold">{summary.totalFormatted}</div>
          <div className="text-xs text-gray-500">{summary.totalHours.toFixed(1)} hours</div>
        </div>
        <div className="rounded-lg border-2 border-secondary bg-white p-3">
          <div className="text-xs font-medium uppercase text-gray-500">Entries</div>
          <div className="text-xl font-bold">{summary.totalEntries}</div>
          <div className="text-xs text-gray-500">{summary.daysWithEntries} days</div>
        </div>
        <div className="rounded-lg border-2 border-secondary bg-white p-3">
          <div className="text-xs font-medium uppercase text-gray-500">Daily Avg</div>
          <div className="text-xl font-bold">{formatDuration(summary.avgMinutesPerDay)}</div>
        </div>
        {showBillable && billable && (
          <div className="rounded-lg border-2 border-green-500 bg-green-50 p-3">
            <div className="text-xs font-medium uppercase text-green-700">Billable</div>
            <div className="text-xl font-bold text-green-700">
              ${billable.totalAmount.toFixed(2)}
            </div>
            <div className="text-xs text-green-600">@ ${billable.hourlyRate}/hr</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={expandAll}
          className="btn-brutal-secondary px-3 py-1 text-xs"
        >
          Expand All
        </button>
        <button
          type="button"
          onClick={collapseAll}
          className="btn-brutal-secondary px-3 py-1 text-xs"
        >
          Collapse All
        </button>
      </div>

      {/* Daily Breakdown - Spreadsheet Style */}
      <div className="overflow-hidden rounded-lg border-3 border-secondary bg-white">
        {/* Table Header */}
        <div className="hidden border-b-2 border-secondary bg-gray-50 px-4 py-2 font-mono text-xs font-semibold uppercase sm:grid sm:grid-cols-12">
          <div className="col-span-2">Time</div>
          <div className="col-span-3">Task</div>
          <div className="col-span-2">Goal</div>
          <div className="col-span-2">Duration</div>
          <div className="col-span-1">Notes</div>
          {includeTaskNotes && <div className="col-span-2">Task Notes</div>}
        </div>

        {dailyBreakdown.map((day) => (
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
                {format(parseISO(day.date), 'EEEE, MMMM d, yyyy')}
              </span>
              <span className="ml-auto font-mono text-sm text-gray-600">
                {day.entries.length} {day.entries.length === 1 ? 'entry' : 'entries'} •{' '}
                <span className="font-semibold text-secondary">{day.totalFormatted}</span>
              </span>
            </button>

            {/* Day Entries */}
            {expandedDays.has(day.date) && (
              <div className="divide-y divide-gray-100">
                {day.entries.map((entry) => (
                  <EntryRow key={entry.id} entry={entry} showScheduleContext={showScheduleContext} includeTaskNotes={includeTaskNotes} />
                ))}
                {/* Daily Subtotal */}
                <div className="flex items-center justify-end gap-4 bg-gray-50 px-4 py-2 font-mono text-sm">
                  <span className="font-semibold uppercase text-gray-600">Day Total:</span>
                  <span className="font-bold text-secondary">{day.totalFormatted}</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Grand Total */}
        <div className="flex items-center justify-end gap-4 border-t-3 border-secondary bg-secondary px-4 py-3 text-white">
          <span className="font-semibold uppercase">Grand Total:</span>
          <span className="text-xl font-bold">{summary.totalFormatted}</span>
          {showBillable && billable && (
            <span className="ml-4 rounded bg-white/20 px-2 py-1 text-sm">
              ${billable.totalAmount.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function EntryRow({ entry, showScheduleContext, includeTaskNotes }: { entry: DetailedTimeEntry; showScheduleContext: boolean; includeTaskNotes?: boolean }) {
  const startTime = entry.startedAt ? format(parseISO(entry.startedAt), 'h:mm a') : '—'
  const endTime = entry.endedAt ? format(parseISO(entry.endedAt), 'h:mm a') : '—'
  const hasScheduleBlock = showScheduleContext && entry.scheduleBlock && entry.scheduleBlock.title

  return (
    <div className="grid grid-cols-1 gap-2 px-4 py-3 transition-colors hover:bg-gray-50 sm:grid-cols-12 sm:items-center sm:gap-0">
      {/* Time */}
      <div className="col-span-2 flex items-center gap-1 font-mono text-sm text-gray-600">
        <Clock className="h-3 w-3 sm:hidden" />
        <span>{startTime}</span>
        <span className="text-gray-400">–</span>
        <span>{endTime}</span>
      </div>

      {/* Task */}
      <div className="col-span-3">
        <div className="font-medium">{entry.taskName}</div>
        {entry.task && entry.task.title !== entry.taskName && (
          <div className="text-xs text-gray-500">{entry.task.title}</div>
        )}
        {/* Schedule Block Badge */}
        {hasScheduleBlock && (
          <div className="mt-1 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px]"
            style={{ 
              borderColor: entry.scheduleBlock?.color || '#e5e7eb',
              backgroundColor: entry.scheduleBlock?.color ? `${entry.scheduleBlock.color}15` : '#f9fafb'
            }}
          >
            <Calendar className="h-2.5 w-2.5" style={{ color: entry.scheduleBlock?.color || '#6b7280' }} />
            <span className="font-medium" style={{ color: entry.scheduleBlock?.color || '#374151' }}>
              {entry.scheduleBlock?.title}
            </span>
            <span className="text-gray-500">
              {entry.scheduleBlock?.startTime}–{entry.scheduleBlock?.endTime}
            </span>
          </div>
        )}
      </div>

      {/* Goal */}
      <div className="col-span-2 flex items-center gap-2">
        {entry.goal ? (
          <>
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: entry.goal.color }}
            />
            <span className="truncate text-sm">{entry.goal.title}</span>
          </>
        ) : (
          <span className="text-sm text-gray-400">No goal</span>
        )}
      </div>

      {/* Duration */}
      <div className="col-span-2 font-mono text-sm font-semibold text-secondary">
        {entry.durationFormatted}
      </div>

      {/* Notes */}
      <div className="col-span-1">
        {entry.notes && (
          <div className="group relative">
            <FileText className="h-4 w-4 cursor-help text-gray-400" />
            <div className="absolute bottom-full right-0 z-10 mb-2 hidden w-48 rounded-lg border-2 border-secondary bg-white p-2 text-xs shadow-lg group-hover:block">
              {entry.notes}
            </div>
          </div>
        )}
      </div>

      {includeTaskNotes && entry.taskNotes && (
        <div className="col-span-2">
          <div className="group relative">
            <FileText className="h-4 w-4 cursor-help text-gray-400" />
            <div className="absolute bottom-full right-0 z-10 mb-2 hidden w-48 rounded-lg border-2 border-secondary bg-white p-2 text-xs shadow-lg group-hover:block">
              {entry.taskNotes}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
