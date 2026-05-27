'use client'

import { useMemo } from 'react'

import { FocusBreakdownCard } from '@/features/reports/components/focus-breakdown-card'
import { FocusCategoryPieCard } from '@/features/reports/components/focus-category-pie-card'
import { emptyFilters, FocusFilters, type ReportFilterState } from '@/features/reports/components/focus-filters'
import { FocusHourlyCard } from '@/features/reports/components/focus-hourly-card'
import { FocusReportExportDialog } from '@/features/reports/components/focus-report-export-dialog'
import { FocusTaskTotalCard } from '@/features/reports/components/focus-task-total-card'
import { FocusTimeGridCard } from '@/features/reports/components/focus-time-grid-card'
import { FocusTrendCard } from '@/features/reports/components/focus-trend-card'
import { ViewGranularityTabs } from '@/features/reports/components/view-granularity-tabs'
import type { FocusGranularity } from '@/features/reports/utils/types'
import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns'

import { useLocalStorage } from '@/hooks/use-local-storage'
import { PageHeader } from '@/components/ui/page-header'
import { PageShell } from '@/components/ui/page-shell'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const GROUP_BY_OPTIONS: Array<{ value: 'goal' | 'task'; label: string }> = [
  { value: 'goal', label: 'By Goal' },
  { value: 'task', label: 'By Task' },
]

function getDateRangeForView(view: FocusGranularity): { startDate: string; endDate: string; label: string } {
  const today = new Date()
  const formatDate = (d: Date) => format(d, 'yyyy-MM-dd')

  switch (view) {
    case 'day':
      return {
        startDate: formatDate(today),
        endDate: formatDate(today),
        label: format(today, 'MMMM d, yyyy'),
      }
    case 'week':
      return {
        startDate: formatDate(startOfWeek(today, { weekStartsOn: 1 })),
        endDate: formatDate(endOfWeek(today, { weekStartsOn: 1 })),
        label: `${format(startOfWeek(today, { weekStartsOn: 1 }), 'MMM d')} - ${format(endOfWeek(today, { weekStartsOn: 1 }), 'MMM d, yyyy')}`,
      }
    case 'month':
      return {
        startDate: formatDate(startOfMonth(today)),
        endDate: formatDate(endOfMonth(today)),
        label: format(today, 'MMMM yyyy'),
      }
  }
}

export function FocusPage() {
  const [view, setView] = useLocalStorage<FocusGranularity>('reports-view', 'week')
  const [groupBy, setGroupBy] = useLocalStorage<'goal' | 'task'>('reports-group-by', 'goal')
  const [filters, setFilters] = useLocalStorage<ReportFilterState>('reports-filters', emptyFilters)

  const dateRange = useMemo(() => getDateRangeForView(view), [view])

  return (
    <PageShell>
      <PageHeader
        eyebrow="Analytics"
        title="Focus"
        description="Visualize your focused time"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <FocusFilters filters={filters} onChange={setFilters} />

            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as 'goal' | 'task')}>
              <SelectTrigger className="h-10 w-[130px]">
                <SelectValue placeholder="Group by" />
              </SelectTrigger>
              <SelectContent>
                {GROUP_BY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <ViewGranularityTabs value={view} onChange={setView} />

            <FocusReportExportDialog view={view} dateRange={dateRange} />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <FocusBreakdownCard view={view} groupBy={groupBy} filters={filters} />
        <FocusTrendCard view={view} filters={filters} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <FocusHourlyCard view={view} filters={filters} />
        <FocusCategoryPieCard view={view} filters={filters} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <FocusTimeGridCard view={view} filters={filters} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <FocusTaskTotalCard view={view} filters={filters} />
      </div>
    </PageShell>
  )
}
