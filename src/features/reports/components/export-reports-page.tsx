'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { ExportReportPreview } from '@/features/reports/components/export-report-preview'
import { ExportReportsFilters } from '@/features/reports/components/export-reports-filters'
import { ExportReportsPageExportDialog } from '@/features/reports/components/export-reports-page-export-dialog'
import { ExportUseCaseHints } from '@/features/reports/components/export-use-case-hints'
import { HOURLY_RATE_STORAGE_KEY } from '@/features/reports/utils/export-reports-constants'
import type { ReportFilters, ReportGroupBy, ReportViewType } from '@/features/reports/utils/types'

import { dateRangeValueToRange, getDefaultDateRangeValue } from '@/lib/date-range-utils'
import { PageHeader } from '@/components/ui/page-header'
import { PageShell } from '@/components/ui/page-shell'
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

  // Ids of entries the user chose to leave out of the NEXT export only.
  // Scoped to this page session (not persisted) and reset whenever the
  // underlying filters change, since the entries on screen change too.
  const [excludedEntryIds, setExcludedEntryIds] = useState<Set<string>>(new Set())

  const toggleExcludedEntry = useCallback((entryId: string) => {
    setExcludedEntryIds((prev) => {
      const next = new Set(prev)
      if (next.has(entryId)) {
        next.delete(entryId)
      } else {
        next.add(entryId)
      }
      return next
    })
  }, [])

  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem(HOURLY_RATE_STORAGE_KEY) : null
      if (stored) setHourlyRateInput(stored)
    } catch {
      // Ignore invalid saved hourly rate
    }
  }, [])

  const hourlyRate = useMemo(() => {
    const parsed = parseFloat(hourlyRateInput)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
  }, [hourlyRateInput])

  // Memoized deliberately: dateRangeValueToRange builds a fresh object
  // literal on every call, with no caching of its own. Left un-memoized
  // here, `dateRange` was a new reference on every render regardless of
  // whether dateRangeValue actually changed - which, as a dependency of
  // `filters` below, made `filters` itself a new reference every render
  // too, defeating that useMemo. The effect further down that resets
  // excludedEntryIds on `[filters]` change then fired on every single
  // render, each time calling setExcludedEntryIds(new Set()) - a new Set
  // reference every time, which React always treats as a real state
  // change - triggering another render, which produced another new
  // `dateRange`, forever: an infinite render loop, surfacing to the user
  // as "Application error: a client-side exception has occurred" (Next's
  // "Maximum update depth exceeded" crash).
  const dateRange = useMemo(() => dateRangeValueToRange(dateRangeValue), [dateRangeValue])

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

  // Clear per-export exclusions whenever the filters change — the set of
  // entries on screen (and their ids) is no longer the same, and this is a
  // "hide from this export" choice, not a durable preference.
  useEffect(() => {
    setExcludedEntryIds(new Set())
  }, [filters])

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
    <PageShell>
      <PageHeader
        eyebrow="Reports"
        title="Export Reports"
        description="Generate detailed or summary reports for invoicing, mentors, or teachers"
        actions={
          <ExportReportsPageExportDialog
            filters={filters}
            dateRange={dateRange}
            viewType={viewType}
            excludedEntryIds={excludedEntryIds}
          />
        }
      />

      <ExportReportsFilters state={filterState} />

      <ExportReportPreview
        filters={filters}
        viewType={viewType}
        includeBillable={includeBillable}
        showScheduleContext={showScheduleContext}
        includeTaskNotes={includeTaskNotes}
        excludedEntryIds={excludedEntryIds}
        onToggleExcludedEntry={toggleExcludedEntry}
      />

      <ExportUseCaseHints />
    </PageShell>
  )
}
