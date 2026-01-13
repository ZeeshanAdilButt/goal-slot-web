'use client'

import { useMemo } from 'react'

import type { ScheduleDayData, ScheduleReportResponse, ScheduleReportRow } from '@/features/reports/utils/types'
import { motion } from 'framer-motion'
import { Calendar, CheckCircle, Clock, Target, TrendingUp } from 'lucide-react'

import { cn, formatDuration } from '@/lib/utils'
import { Loading } from '@/components/ui/loading'

interface ScheduleReportViewProps {
  data: ScheduleReportResponse
  isLoading?: boolean
}

function getCompletionColor(percentage: number): string {
  if (percentage >= 90) return 'bg-green-500'
  if (percentage >= 70) return 'bg-green-400'
  if (percentage >= 50) return 'bg-yellow-400'
  if (percentage >= 25) return 'bg-orange-400'
  if (percentage > 0) return 'bg-red-400'
  return 'bg-slate-200'
}

function getCompletionTextColor(percentage: number): string {
  if (percentage >= 90) return 'text-green-700'
  if (percentage >= 70) return 'text-green-600'
  if (percentage >= 50) return 'text-yellow-700'
  if (percentage >= 25) return 'text-orange-600'
  if (percentage > 0) return 'text-red-600'
  return 'text-slate-400'
}

function DayCell({ day, hasSchedule }: { day: ScheduleDayData; hasSchedule: boolean }) {
  if (!hasSchedule) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 p-2">
        <span className="text-xs text-slate-300">—</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group relative flex h-full flex-col p-2 transition-colors',
        day.loggedMinutes > 0 ? 'bg-white' : 'bg-slate-50',
      )}
      title={day.tasks.map((t) => `${t.taskName}: ${t.formatted}`).join('\n') || 'No time logged'}
    >
      {/* Progress bar background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-300',
            getCompletionColor(day.percentage),
            'opacity-20 group-hover:opacity-30',
          )}
          style={{ width: `${Math.min(100, day.percentage)}%` }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="text-center">
          <span className={cn('font-mono text-sm font-bold', getCompletionTextColor(day.percentage))}>
            {day.loggedFormatted || '0m'}
          </span>
        </div>

        <div className="mt-1 text-center">
          <span className={cn('font-mono text-[10px]', day.percentage >= 100 ? 'text-green-600' : 'text-slate-500')}>
            {day.percentage > 0 ? `${Math.round(day.percentage)}%` : ''}
          </span>
        </div>

        {/* Tasks preview on hover */}
        {day.tasks.length > 0 && (
          <div className="absolute left-1/2 top-full z-20 hidden w-48 -translate-x-1/2 rounded border-2 border-secondary bg-white p-2 shadow-brutal group-hover:block">
            <div className="space-y-1">
              {day.tasks.slice(0, 5).map((task, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="truncate">{task.taskName}</span>
                  <span className="ml-2 flex-shrink-0 font-mono text-slate-500">{task.formatted}</span>
                </div>
              ))}
              {day.tasks.length > 5 && <div className="text-[10px] text-slate-400">+ {day.tasks.length - 5} more</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ScheduleRow({ row, days }: { row: ScheduleReportRow; days: ScheduleReportResponse['days'] }) {
  return (
    <div
      className="grid border-b-2 border-secondary last:border-b-0"
      style={{ gridTemplateColumns: `minmax(200px, 280px) repeat(${days.length}, minmax(80px, 1fr)) 100px` }}
    >
      {/* Schedule Info Column */}
      <div
        className="flex flex-col justify-center border-r-2 border-secondary p-3"
        style={{ backgroundColor: row.pattern.color ? `${row.pattern.color}15` : undefined }}
      >
        <div className="flex items-center gap-2">
          {row.pattern.color && (
            <div
              className="h-3 w-3 flex-shrink-0 rounded-sm border border-secondary"
              style={{ backgroundColor: row.pattern.color }}
            />
          )}
          <span className="font-bold uppercase">{row.pattern.title}</span>
        </div>
        <div className="mt-1 font-mono text-xs text-slate-600">{row.pattern.timeRangeFormatted}</div>
        {row.pattern.goalTitle && (
          <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <Target className="h-3 w-3" />
            <span className="truncate">{row.pattern.goalTitle}</span>
          </div>
        )}
        <div className="mt-1 font-mono text-[10px] text-slate-400">
          {row.pattern.daysOfWeek.map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}
        </div>
      </div>

      {/* Day Columns */}
      {days.map((day) => {
        const dayData = row.days.find((d) => d.date === day.date)
        const hasSchedule = row.pattern.daysOfWeek.includes(day.dayNumber)

        return (
          <div key={day.date} className="min-h-[80px] border-r border-secondary/30 last:border-r-0">
            {dayData ? (
              <DayCell day={dayData} hasSchedule={hasSchedule} />
            ) : (
              <div className="flex h-full items-center justify-center bg-slate-50 p-2">
                <span className="text-xs text-slate-300">—</span>
              </div>
            )}
          </div>
        )
      })}

      {/* Total Column */}
      <div className="flex flex-col items-center justify-center bg-slate-50 p-2">
        <span className="font-mono text-sm font-bold">{row.totalLoggedFormatted}</span>
        <span
          className={cn(
            'font-mono text-[10px]',
            row.overallPercentage >= 80
              ? 'text-green-600'
              : row.overallPercentage >= 50
                ? 'text-yellow-600'
                : 'text-slate-500',
          )}
        >
          {Math.round(row.overallPercentage)}%
        </span>
      </div>
    </div>
  )
}

export function ScheduleReportView({ data, isLoading }: ScheduleReportViewProps) {
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loading size="md" />
      </div>
    )
  }

  if (!data || data.rows.length === 0) {
    return (
      <div className="card-brutal py-16 text-center">
        <Calendar className="mx-auto mb-4 h-16 w-16 opacity-30" />
        <h3 className="mb-2 text-xl font-bold uppercase">No Schedule Data</h3>
        <p className="font-mono text-gray-600">No time entries with schedule blocks found for this period.</p>
        <p className="mt-2 text-sm text-gray-500">
          Make sure your time entries are linked to schedule blocks to see this report.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        <div className="card-brutal p-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-4 w-4" />
            <span className="font-mono text-xs uppercase">Logged</span>
          </div>
          <div className="mt-2 text-2xl font-bold">{data.summary.totalFormatted}</div>
        </div>

        <div className="card-brutal p-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span className="font-mono text-xs uppercase">Expected</span>
          </div>
          <div className="mt-2 text-2xl font-bold">{data.summary.totalExpectedFormatted}</div>
        </div>

        <div className="card-brutal p-4">
          <div className="flex items-center gap-2 text-gray-600">
            <TrendingUp className="h-4 w-4" />
            <span className="font-mono text-xs uppercase">Completion</span>
          </div>
          <div
            className={cn(
              'mt-2 text-2xl font-bold',
              data.summary.overallPercentage >= 80
                ? 'text-green-600'
                : data.summary.overallPercentage >= 50
                  ? 'text-yellow-600'
                  : 'text-red-600',
            )}
          >
            {Math.round(data.summary.overallPercentage)}%
          </div>
        </div>

        <div className="card-brutal p-4">
          <div className="flex items-center gap-2 text-gray-600">
            <CheckCircle className="h-4 w-4" />
            <span className="font-mono text-xs uppercase">Schedules</span>
          </div>
          <div className="mt-2 text-2xl font-bold">{data.summary.schedulesTracked}</div>
        </div>
      </motion.div>

      {/* Schedule Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-brutal overflow-hidden"
      >
        <div className="border-b-2 border-secondary bg-slate-50 p-4">
          <h3 className="flex items-center gap-2 text-lg font-bold uppercase">
            <Calendar className="h-5 w-5" />
            Schedule Breakdown
          </h3>
          <p className="font-mono text-xs text-slate-600">
            Hours logged per schedule block across {data.days.length} days
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header Row */}
            <div
              className="grid border-b-2 border-secondary bg-slate-100"
              style={{
                gridTemplateColumns: `minmax(200px, 280px) repeat(${data.days.length}, minmax(80px, 1fr)) 100px`,
              }}
            >
              <div className="border-r-2 border-secondary p-3">
                <span className="font-mono text-xs font-bold uppercase text-slate-600">Schedule</span>
              </div>
              {data.days.map((day) => (
                <div key={day.date} className="border-r border-secondary/30 p-3 text-center last:border-r-0">
                  <div className="font-mono text-xs font-bold uppercase">{day.dayOfWeek}</div>
                  <div className="font-mono text-[10px] text-slate-500">{day.date.split('-').slice(1).join('/')}</div>
                </div>
              ))}
              <div className="p-3 text-center">
                <span className="font-mono text-xs font-bold uppercase text-slate-600">Total</span>
              </div>
            </div>

            {/* Data Rows */}
            {data.rows.map((row, index) => (
              <ScheduleRow key={row.pattern.patternKey || index} row={row} days={data.days} />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
        <span className="font-mono text-slate-500">COMPLETION:</span>
        <div className="flex items-center gap-2">
          <div className="h-3 w-6 rounded-sm bg-green-500" />
          <span className="font-mono">90%+</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-6 rounded-sm bg-yellow-400" />
          <span className="font-mono">50-89%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-6 rounded-sm bg-orange-400" />
          <span className="font-mono">25-49%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-6 rounded-sm bg-red-400" />
          <span className="font-mono">&lt;25%</span>
        </div>
      </div>
    </div>
  )
}
