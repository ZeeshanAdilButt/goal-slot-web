'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { ExportReportPreview } from '@/features/reports/components/export-report-preview'
import { ExportReportsFilters } from '@/features/reports/components/export-reports-filters'
import { ExportReportsPageExportDialog } from '@/features/reports/components/export-reports-page-export-dialog'
import { ExportUseCaseHints } from '@/features/reports/components/export-use-case-hints'
import { HOURLY_RATE_STORAGE_KEY } from '@/features/reports/utils/export-reports-constants'
import type { ReportFilters, ReportGroupBy, ReportViewType } from '@/features/reports/utils/types'

import { dateRangeValueToRange, getDefaultDateRangeValue } from '@/lib/date-range-utils'
import type { DateRangeValue } from '@/components/DateRangePicker/types'

export function ExportReportsPage() {
  const [dateRangeValue, setDateRangeValue] = useState<DateRangeValue>(getDefaultDateRangeValue)
  const [viewType, setViewType] = useState<ReportViewType>('detailed')
  const [groupBy, setGroupBy] = useState<ReportGroupBy>('goal')
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([])
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [includeBillable, setIncludeBillable] = useState(false)
  const [hourlyRateInput, setHourlyRateInput] = useState('50')
  const [showScheduleContext, setShowScheduleContext] = useState(false)
  const [includeTaskNotes, setIncludeTaskNotes] = useState(false)

  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem(HOURLY_RATE_STORAGE_KEY) : null
      if (stored) setHourlyRateInput(stored)
    } catch (error) {
      console.error('Failed to read saved hourly rate', error)
    }
  }, [])

  const hourlyRate = useMemo(() => {
    const parsed = parseFloat(hourlyRateInput)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
  }, [hourlyRateInput])

  const dateRange = dateRangeValueToRange(dateRangeValue)

  const filters: ReportFilters = useMemo(
    () => ({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      viewType,
      groupBy,
      goalIds: selectedGoalIds.length > 0 ? selectedGoalIds : undefined,
      taskIds: selectedTaskIds.length > 0 ? selectedTaskIds : undefined,
      includeBillable,
      hourlyRate: includeBillable ? hourlyRate : undefined,
      showScheduleContext,
      includeTaskNotes,
    }),
    [
      dateRange,
      viewType,
      groupBy,
      selectedGoalIds,
      selectedTaskIds,
      includeBillable,
      hourlyRate,
      showScheduleContext,
      includeTaskNotes,
    ],
  )

  const toggleGoalFilter = useCallback((goalId: string) => {
    setSelectedGoalIds((prev) => (prev.includes(goalId) ? prev.filter((id) => id !== goalId) : [...prev, goalId]))
  }, [])

  const toggleTaskFilter = useCallback((taskId: string) => {
    setSelectedTaskIds((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]))
  }, [])

  const clearFilters = useCallback(() => {
    setSelectedGoalIds([])
    setSelectedTaskIds([])
  }, [])

  const hasActiveFilters = selectedGoalIds.length > 0 || selectedTaskIds.length > 0

  const filterState = {
    dateRangeValue,
    setDateRangeValue,
    viewType,
    setViewType,
    groupBy,
    setGroupBy,
    selectedGoalIds,
    toggleGoalFilter,
    setSelectedGoalIds,
    selectedTaskIds,
    toggleTaskFilter,
    setSelectedTaskIds,
    includeBillable,
    setIncludeBillable,
    hourlyRateInput,
    setHourlyRateInput,
    showScheduleContext,
    setShowScheduleContext,
    includeTaskNotes,
    setIncludeTaskNotes,
    dateRange,
    clearFilters,
    hasActiveFilters,
  }

  return (
    <div className="space-y-6 p-2 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase sm:text-4xl">Export Reports</h1>
          <p className="font-mono text-sm uppercase text-gray-600">
            Generate detailed or summary reports for invoicing, mentors, or teachers
          </p>
        </div>

        <ExportReportsPageExportDialog filters={filters} dateRange={dateRange} viewType={viewType} />
      </div>

      <ExportReportsFilters state={filterState} />

      <ExportReportPreview
        filters={filters}
        viewType={viewType}
        includeBillable={includeBillable}
        showScheduleContext={showScheduleContext}
        includeTaskNotes={includeTaskNotes}
      />

      <ExportUseCaseHints />
    </div>
  )
}
