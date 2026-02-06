'use client'

import { DetailedReportView } from '@/features/reports/components/detailed-report-view'
import { SummaryReportView } from '@/features/reports/components/summary-report-view'
import {
  useDayByTaskReportQuery,
  useDayTotalReportQuery,
  useDetailedReportQuery,
  useSummaryReportQuery,
} from '@/features/reports/hooks/use-detailed-summary-reports'
import type { ReportFilters, ReportViewType } from '@/features/reports/utils/types'
import { format } from 'date-fns'

import { Loading } from '@/components/ui/loading'

export interface ExportReportPreviewProps {
  filters: ReportFilters
  viewType: ReportViewType
  includeBillable: boolean
  showScheduleContext: boolean
  includeTaskNotes: boolean
}

export function ExportReportPreview({
  filters,
  viewType,
  includeBillable,
  showScheduleContext,
  includeTaskNotes,
}: ExportReportPreviewProps) {
  const detailedQuery = useDetailedReportQuery(filters, { enabled: viewType === 'detailed' })
  const summaryQuery = useSummaryReportQuery(filters, { enabled: viewType === 'summary' })
  const dayByTaskQuery = useDayByTaskReportQuery(filters, { enabled: viewType === 'day_by_task' })
  const dayTotalQuery = useDayTotalReportQuery(filters, { enabled: viewType === 'day_total' })

  const isLoading =
    viewType === 'detailed'
      ? detailedQuery.isLoading
      : viewType === 'summary'
        ? summaryQuery.isLoading
        : viewType === 'day_by_task'
          ? dayByTaskQuery.isLoading
          : dayTotalQuery.isLoading

  if (isLoading) {
    return (
      <div className="card-brutal flex min-h-[400px] items-center justify-center">
        <Loading size="sm" />
      </div>
    )
  }

  if (viewType === 'detailed' && detailedQuery.data) {
    return (
      <div className="card-brutal min-h-[400px]">
        <DetailedReportView
          dailyBreakdown={detailedQuery.data.dailyBreakdown}
          summary={detailedQuery.data.summary}
          billable={detailedQuery.data.billable}
          showBillable={includeBillable}
          showScheduleContext={showScheduleContext}
          includeTaskNotes={includeTaskNotes}
        />
      </div>
    )
  }

  if (viewType === 'summary' && summaryQuery.data) {
    return (
      <div className="card-brutal min-h-[400px]">
        <SummaryReportView
          items={summaryQuery.data.items}
          dateBreakdown={summaryQuery.data.dateBreakdown}
          groupBy={summaryQuery.data.groupBy}
          summary={summaryQuery.data.summary}
          billable={summaryQuery.data.billable}
          showBillable={includeBillable}
        />
      </div>
    )
  }

  if (viewType === 'day_by_task' && dayByTaskQuery.data) {
    return (
      <div className="card-brutal min-h-[400px] p-6">
        <h3 className="mb-4 text-lg font-bold">Day by Task Report</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-32 px-4 py-2 text-left font-bold">Date</th>
                <th className="px-4 py-2 text-left font-bold">Tasks</th>
                <th className="w-24 px-4 py-2 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dayByTaskQuery.data.dailyBreakdown.map((day, i) => (
                <tr key={i}>
                  <td className="px-4 py-2 align-top font-medium text-gray-900">
                    {format(new Date(day.date), 'MMM d')}
                    <div className="text-xs text-gray-500">{day.dayOfWeek}</div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="space-y-1">
                      {day.tasks.map((task, j) => (
                        <div key={j} className="flex justify-between gap-4 text-gray-700">
                          <span style={task.goalColor ? { color: task.goalColor } : undefined}>{task.taskName}</span>
                          <span className="font-mono text-xs text-gray-500">{task.totalFormatted}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right align-top font-bold text-gray-900">{day.totalFormatted}</td>
                </tr>
              ))}
              {dayByTaskQuery.data.dailyBreakdown.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                    No activity found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (viewType === 'day_total' && dayTotalQuery.data) {
    return (
      <div className="card-brutal min-h-[400px] p-6">
        <h3 className="mb-4 text-lg font-bold">Day Total Report</h3>
        <div className="space-y-4">
          {dayTotalQuery.data.dailyBreakdown.map((day, i) => (
            <div key={i} className="border-2 border-gray-200 bg-white shadow-brutal">
              <div className="flex items-center justify-between border-b-2 border-gray-200 bg-gray-50 px-4 py-3">
                <span className="text-lg font-bold text-gray-900">{format(new Date(day.date), 'EEEE, MMMM d')}</span>
                <span className="font-mono text-lg font-bold text-gray-900">{day.totalFormatted}</span>
              </div>
              <div className="divide-y divide-gray-100">
                {day.goalGroups && day.goalGroups.length > 0 ? (
                  day.goalGroups.map((group, gi) => (
                    <div key={gi} className="flex items-start gap-3 px-4 py-3">
                      <div
                        className="mt-1 h-4 w-4 flex-shrink-0 border-2 border-gray-800"
                        style={{
                          backgroundColor: group.goalColor || '#94a3b8',
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-gray-900">{group.goalTitle}</div>
                        <div className="font-mono text-sm text-gray-600">{group.taskNames}</div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <span className="font-mono font-bold text-gray-700">{group.totalFormatted}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 font-mono text-sm text-gray-600">{day.taskNames}</div>
                )}
              </div>
            </div>
          ))}
          {dayTotalQuery.data.dailyBreakdown.length === 0 && (
            <div className="border-2 border-gray-200 bg-white px-4 py-8 text-center text-gray-500 shadow-brutal">
              No activity found for this period.
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="card-brutal flex min-h-[400px] items-center justify-center text-gray-500">
      Select a date range to view your report
    </div>
  )
}
