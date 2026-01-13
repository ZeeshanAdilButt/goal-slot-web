'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { DetailedReportView } from '@/features/reports/components/detailed-report-view'
import { SummaryReportView } from '@/features/reports/components/summary-report-view'
import {
  useDayByTaskReportQuery,
  useDayTotalReportQuery,
  useDetailedReportQuery,
  useExportReportMutation,
  useFilterableGoalsQuery,
  useFilterableTasksQuery,
  useSummaryReportQuery,
} from '@/features/reports/hooks/use-detailed-summary-reports'
import type { ExportFormat, ReportFilters, ReportGroupBy, ReportViewType } from '@/features/reports/utils/types'
import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, subDays, subMonths } from 'date-fns'
import {
  Calendar,
  ChevronDown,
  DollarSign,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  Target,
  X,
} from 'lucide-react'

import { cn, formatDuration } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loading } from '@/components/ui/loading'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

type DatePreset =
  | 'today'
  | 'yesterday'
  | 'this-week'
  | 'last-week'
  | 'this-month'
  | 'last-month'
  | 'last-30-days'
  | 'custom'

const DATE_PRESETS: Array<{ value: DatePreset; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this-week', label: 'This Week' },
  { value: 'last-week', label: 'Last Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'last-30-days', label: 'Last 30 Days' },
  { value: 'custom', label: 'Custom Range' },
]

const HOURLY_RATE_STORAGE_KEY = 'reportsHourlyRate'

const VIEW_TYPE_OPTIONS: Array<{ value: ReportViewType; label: string; description: string }> = [
  { value: 'detailed', label: 'Detailed View', description: 'Shows every entry with timestamps' },
  { value: 'summary', label: 'Summary View', description: 'Compact aggregated totals' },
  { value: 'day_by_task', label: 'Day by Task', description: 'Hours per task per day (aggregated)' },
  { value: 'day_total', label: 'Day Total', description: 'Total hours per day with task list' },
]

const GROUP_BY_OPTIONS: Array<{ value: ReportGroupBy; label: string }> = [
  { value: 'goal', label: 'By Goal' },
  { value: 'task', label: 'By Task' },
  { value: 'category', label: 'By Category' },
  { value: 'date', label: 'By Date' },
]

function getDateRange(preset: DatePreset): { startDate: string; endDate: string } {
  const today = new Date()
  const formatDate = (d: Date) => format(d, 'yyyy-MM-dd')

  switch (preset) {
    case 'today':
      return { startDate: formatDate(today), endDate: formatDate(today) }
    case 'yesterday':
      const yesterday = subDays(today, 1)
      return { startDate: formatDate(yesterday), endDate: formatDate(yesterday) }
    case 'this-week':
      return {
        startDate: formatDate(startOfWeek(today, { weekStartsOn: 1 })),
        endDate: formatDate(endOfWeek(today, { weekStartsOn: 1 })),
      }
    case 'last-week':
      const lastWeekStart = subDays(startOfWeek(today, { weekStartsOn: 1 }), 7)
      return {
        startDate: formatDate(lastWeekStart),
        endDate: formatDate(subDays(startOfWeek(today, { weekStartsOn: 1 }), 1)),
      }
    case 'this-month':
      return {
        startDate: formatDate(startOfMonth(today)),
        endDate: formatDate(endOfMonth(today)),
      }
    case 'last-month':
      const lastMonth = subMonths(today, 1)
      return {
        startDate: formatDate(startOfMonth(lastMonth)),
        endDate: formatDate(endOfMonth(lastMonth)),
      }
    case 'last-30-days':
      return {
        startDate: formatDate(subDays(today, 30)),
        endDate: formatDate(today),
      }
    default:
      return {
        startDate: formatDate(startOfWeek(today, { weekStartsOn: 1 })),
        endDate: formatDate(endOfWeek(today, { weekStartsOn: 1 })),
      }
  }
}

export function ExportReportsPage() {
  // Date preset & custom dates
  const [datePreset, setDatePreset] = useState<DatePreset>('this-week')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  // View type & grouping
  const [viewType, setViewType] = useState<ReportViewType>('detailed')
  const [groupBy, setGroupBy] = useState<ReportGroupBy>('goal')

  // Filters
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([])
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])

  // Billable settings
  const [includeBillable, setIncludeBillable] = useState(false)
  const [hourlyRateInput, setHourlyRateInput] = useState('50')

  // Schedule context (beautification option)
  const [showScheduleContext, setShowScheduleContext] = useState(false)

  // Restore persisted hourly rate on mount
  useEffect(() => {
    try {
      const storedRate = typeof window !== 'undefined' ? window.localStorage.getItem(HOURLY_RATE_STORAGE_KEY) : null
      if (storedRate) {
        setHourlyRateInput(storedRate)
      }
    } catch (error) {
      console.error('Failed to read saved hourly rate', error)
    }
  }, [])

  // Derived numeric hourly rate for filters/requests
  const hourlyRate = useMemo(() => {
    const parsed = parseFloat(hourlyRateInput)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
  }, [hourlyRateInput])

  // Export dialog state
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportTitle, setExportTitle] = useState('Time Report')
  const [exportClientName, setExportClientName] = useState('')
  const [exportProjectName, setExportProjectName] = useState('')
  const [exportNotes, setExportNotes] = useState('')

  // Calculate actual dates
  const dateRange = useMemo(() => {
    if (datePreset === 'custom' && customStartDate && customEndDate) {
      return { startDate: customStartDate, endDate: customEndDate }
    }
    return getDateRange(datePreset)
  }, [datePreset, customStartDate, customEndDate])

  // Build filters object
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
    }),
    [dateRange, viewType, groupBy, selectedGoalIds, selectedTaskIds, includeBillable, hourlyRate, showScheduleContext],
  )

  // Queries
  const detailedQuery = useDetailedReportQuery(filters, { enabled: viewType === 'detailed' })
  const summaryQuery = useSummaryReportQuery(filters, { enabled: viewType === 'summary' })
  const dayByTaskQuery = useDayByTaskReportQuery(filters, { enabled: viewType === 'day_by_task' })
  const dayTotalQuery = useDayTotalReportQuery(filters, { enabled: viewType === 'day_total' })
  const goalsQuery = useFilterableGoalsQuery()
  const tasksQuery = useFilterableTasksQuery()
  const exportMutation = useExportReportMutation()

  const isLoading =
    viewType === 'detailed'
      ? detailedQuery.isLoading
      : viewType === 'summary'
        ? summaryQuery.isLoading
        : viewType === 'day_by_task'
          ? dayByTaskQuery.isLoading
          : dayTotalQuery.isLoading

  // Handle goal filter toggle
  const toggleGoalFilter = useCallback((goalId: string) => {
    setSelectedGoalIds((prev) => (prev.includes(goalId) ? prev.filter((id) => id !== goalId) : [...prev, goalId]))
  }, [])

  // Handle task filter toggle
  const toggleTaskFilter = useCallback((taskId: string) => {
    setSelectedTaskIds((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]))
  }, [])

  // Handle export
  const handleExport = useCallback(
    async (exportFormat: ExportFormat) => {
      try {
        const result = await exportMutation.mutateAsync({
          ...filters,
          format: exportFormat,
          title: exportTitle,
          clientName: exportClientName || undefined,
          projectName: exportProjectName || undefined,
          notes: exportNotes || undefined,
        })

        if (exportFormat === 'csv' && result instanceof Blob) {
          // Download CSV file
          const url = window.URL.createObjectURL(result)
          const a = document.createElement('a')
          a.href = url
          a.download = `time-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        } else if (exportFormat === 'json') {
          // Download JSON file
          const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `time-report-${dateRange.startDate}-to-${dateRange.endDate}.json`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        } else if (exportFormat === 'pdf' && result?.pdfReady && result.data) {
          // Client-side PDF generation via Print
          const data = result.data

          // Calculate HTML content BEFORE opening the window.
          // This prevents opening a blank window if there's an error during generation.
          try {
            let itemsHtml = ''

            if (viewType === 'detailed') {
              itemsHtml = `
                  <table class="table">
                    <thead><tr><th>Date</th><th>Task</th><th>Goal</th><th>Duration</th></tr></thead>
                    <tbody>${(data.dailyBreakdown || [])
                      .map((d: any) =>
                        (d.entries || [])
                          .map(
                            (e: any) => `
                      <tr>
                        <td>${d.date}</td>
                        <td>${e.task?.title || e.taskName || '-'}</td>
                        <td>${e.goal?.title || '-'}</td>
                        <td>${formatDuration(e.duration)}</td>
                      </tr>`,
                          )
                          .join(''),
                      )
                      .join('')}
                    </tbody>
                  </table>`
            } else if (viewType === 'day_by_task') {
              itemsHtml = `
                   <table class="table">
                    <thead><tr><th>Date</th><th>Task</th><th>Total</th></tr></thead>
                    <tbody>${(data.dailyBreakdown || [])
                      .map((d: any) =>
                        (d.tasks || [])
                          .map(
                            (t: any) => `
                      <tr>
                         <td>${d.date}</td>
                         <td>${t.taskName}</td>
                         <td>${t.totalFormatted}</td>
                      </tr>
                    `,
                          )
                          .join(''),
                      )
                      .join('')}</tbody>
                   </table>
                `
            } else if (viewType === 'day_total') {
              itemsHtml = `
                   <table class="table">
                    <thead><tr><th>Date</th><th>Tasks Include</th><th>Total</th></tr></thead>
                    <tbody>${(data.dailyBreakdown || [])
                      .map(
                        (d: any) => `
                      <tr>
                         <td>${d.date}</td>
                         <td>${d.taskNames}</td>
                         <td>${d.totalFormatted}</td>
                      </tr>
                    `,
                      )
                      .join('')}</tbody>
                   </table>
                `
            } else {
              // Summary
              itemsHtml = `
                  <table class="table">
                    <thead><tr><th>Name</th><th>Entries</th><th>Total</th></tr></thead>
                    <tbody>${(data.items || [])
                      .map(
                        (i: any) => `
                      <tr>
                        <td>${i.name}</td>
                        <td>${i.entriesCount}</td>
                        <td>${i.totalFormatted}</td>
                      </tr>`,
                      )
                      .join('')}
                    </tbody>
                  </table>`
            }

            const html = `
               <!DOCTYPE html>
               <html>
                 <head>
                   <title>${exportTitle}</title>
                   <style>
                     body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; color: #111; }
                     h1 { text-transform: uppercase; font-weight: 800; margin-bottom: 0.5rem; }
                     .meta { color: #666; font-family: monospace; margin-bottom: 2rem; }
                     .notes { background: #f5f5f5; padding: 1rem; margin-bottom: 2rem; border-radius: 4px; }
                     .table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
                     .table th { text-align: left; border-bottom: 2px solid #000; padding: 0.5rem; }
                     .table td { border-bottom: 1px solid #ddd; padding: 0.5rem; }
                     .summary-box { display: flex; gap: 2rem; margin-bottom: 2rem; padding: 1rem; border: 1px solid #ccc; background: white; }
                     @media print { 
                        body { padding: 0; max-width: none; }
                        .summary-box, .notes { border: 1px solid #ccc !important; -webkit-print-color-adjust: exact; }
                     }
                   </style>
                 </head>
                 <body>
                   <h1>${exportTitle}</h1>
                   <div class="meta">
                     Report: ${viewType.replace(/_/g, ' ').toUpperCase()}<br/>
                     ${format(new Date(dateRange.startDate), 'MMM d')} - ${format(new Date(dateRange.endDate), 'MMM d, yyyy')}<br/>
                     Generated on ${format(new Date(), 'MMM d, yyyy HH:mm')}
                   </div>
                   
                   ${
                     exportClientName || exportProjectName
                       ? `
                     <div class="meta" style="margin-top: -1rem; margin-bottom: 2rem;">
                       ${exportClientName ? `<div><strong>Client:</strong> ${exportClientName}</div>` : ''}
                       ${exportProjectName ? `<div><strong>Project:</strong> ${exportProjectName}</div>` : ''}
                     </div>
                   `
                       : ''
                   }
                   
                   ${exportNotes ? `<div class="notes"><strong>Notes:</strong><br/>${exportNotes}</div>` : ''}
                   
                   <div class="summary-box">
                      <div>
                        <strong>Total Time</strong><br/>
                        ${data.summary?.totalFormatted || '0h 0m'}
                      </div>
                      <div>
                        <strong>Total Entries</strong><br/>
                        ${data.summary?.totalEntries || 0}
                      </div>
                      ${
                        data.billable
                          ? `
                        <div>
                           <strong>Billable Amount</strong><br/>
                           $${data.billable.totalAmount}
                        </div>
                      `
                          : ''
                      }
                   </div>

                   ${itemsHtml}
                   
                   <script>
                      window.onload = () => {
                        // Small delay to ensure styles are applied
                        setTimeout(() => {
                           window.print();
                        }, 100);
                      };
                   </script>
                 </body>
               </html>
             `

            const printWindow = window.open('', '_blank')
            if (printWindow) {
              printWindow.document.open()
              printWindow.document.write(html)
              printWindow.document.close()
            }
          } catch (err) {
            console.error('Error generating PDF content:', err)
            // Could show toast error here
          }
        }

        setExportDialogOpen(false)
      } catch (error) {
        console.error('Export failed:', error)
      }
    },
    [exportMutation, filters, dateRange, exportTitle, exportClientName, exportProjectName, exportNotes],
  )

  const clearFilters = () => {
    setSelectedGoalIds([])
    setSelectedTaskIds([])
  }

  const hasActiveFilters = selectedGoalIds.length > 0 || selectedTaskIds.length > 0

  return (
    <div className="space-y-6 p-2 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase sm:text-4xl">Export Reports</h1>
          <p className="font-mono text-sm uppercase text-gray-600">
            Generate detailed or summary reports for invoicing, mentors, or teachers
          </p>
        </div>

        <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-brutal gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </DialogTrigger>
          <DialogContent className="border-3 border-secondary sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold uppercase">Export Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Report Title</Label>
                <Input
                  value={exportTitle}
                  onChange={(e) => setExportTitle(e.target.value)}
                  placeholder="e.g., Weekly Progress Report"
                  className="border-2 border-secondary"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Client Name (optional)</Label>
                  <Input
                    value={exportClientName}
                    onChange={(e) => setExportClientName(e.target.value)}
                    placeholder="e.g., Acme Corp"
                    className="border-2 border-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Project Name (optional)</Label>
                  <Input
                    value={exportProjectName}
                    onChange={(e) => setExportProjectName(e.target.value)}
                    placeholder="e.g., Website Redesign"
                    className="border-2 border-secondary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={exportNotes}
                  onChange={(e) => setExportNotes(e.target.value)}
                  placeholder="Additional notes for the report..."
                  rows={3}
                  className="border-2 border-secondary"
                />
              </div>
            </div>
            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => handleExport('csv')}
                disabled={exportMutation.isPending}
                className="gap-2 sm:flex-1"
              >
                <FileSpreadsheet className="h-4 w-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('json')}
                disabled={exportMutation.isPending}
                className="gap-2 sm:flex-1"
              >
                <FileJson className="h-4 w-4" />
                JSON
              </Button>
              <Button
                onClick={() => handleExport('pdf')}
                disabled={exportMutation.isPending}
                className="gap-2 sm:flex-1"
              >
                <FileText className="h-4 w-4" />
                Print PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters Section */}
      <div className="card-brutal space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <h2 className="font-bold uppercase">Filters</h2>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <X className="h-3 w-3" />
              Clear filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Date Preset */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range
            </Label>
            <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
              <SelectTrigger className="border-2 border-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {datePreset === 'custom' && (
              <div className="mt-2 flex gap-2">
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="border-2 border-secondary"
                />
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="border-2 border-secondary"
                />
              </div>
            )}
          </div>

          {/* View Type */}
          <div className="space-y-2">
            <Label>View Type</Label>
            <Select value={viewType} onValueChange={(v) => setViewType(v as ReportViewType)}>
              <SelectTrigger className="border-2 border-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VIEW_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div>
                      <div className="font-medium">{opt.label}</div>
                      <div className="text-xs text-gray-500">{opt.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Group By (for summary view) */}
          {viewType === 'summary' && (
            <div className="space-y-2">
              <Label>Group By</Label>
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as ReportGroupBy)}>
                <SelectTrigger className="border-2 border-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_BY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Goal Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Filter by Goal
            </Label>
            <Popover>
              <div className="flex w-full items-center gap-1">
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between border-2 border-secondary">
                    {selectedGoalIds.length > 0 ? `${selectedGoalIds.length} selected` : 'All goals'}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                {selectedGoalIds.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedGoalIds([])}
                    title="Clear goal selection"
                    className="shrink-0"
                  >
                    <X className="h-4 w-4 text-gray-500 hover:text-red-500" />
                  </Button>
                )}
              </div>
              <PopoverContent className="w-64 border-2 border-secondary p-2">
                <div className="max-h-64 space-y-1 overflow-y-auto">
                  {goalsQuery.data?.map((goal) => (
                    <label
                      key={goal.id}
                      className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-gray-100"
                    >
                      <Checkbox
                        checked={selectedGoalIds.includes(goal.id)}
                        onCheckedChange={() => toggleGoalFilter(goal.id)}
                      />
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: goal.color }} />
                      <span className="truncate text-sm">{goal.title}</span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Task Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Filter by Task
            </Label>
            <Popover>
              <div className="flex w-full items-center gap-1">
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between border-2 border-secondary">
                    {selectedTaskIds.length > 0 ? `${selectedTaskIds.length} selected` : 'All tasks'}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                {selectedTaskIds.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedTaskIds([])}
                    title="Clear task selection"
                    className="shrink-0"
                  >
                    <X className="h-4 w-4 text-gray-500 hover:text-red-500" />
                  </Button>
                )}
              </div>
              <PopoverContent className="w-64 border-2 border-secondary p-2">
                <div className="max-h-64 space-y-1 overflow-y-auto">
                  {tasksQuery.data?.slice(0, 50).map((task) => (
                    <label
                      key={task.id}
                      className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-gray-100"
                    >
                      <Checkbox
                        checked={selectedTaskIds.includes(task.id)}
                        onCheckedChange={() => toggleTaskFilter(task.id)}
                      />
                      <span className="truncate text-sm">{task.title}</span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Billable Toggle */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Billable Hours
            </Label>
            <div className="flex items-center gap-4 rounded-lg border-2 border-secondary p-3">
              <Switch checked={includeBillable} onCheckedChange={setIncludeBillable} />
              <span className="text-sm">Include billing</span>
            </div>
            {includeBillable && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Rate:</span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={hourlyRateInput}
                    onChange={(e) => {
                      const next = e.target.value
                      setHourlyRateInput(next)
                      const parsed = parseFloat(next)
                      if (Number.isFinite(parsed) && parsed >= 0) {
                        try {
                          window.localStorage.setItem(HOURLY_RATE_STORAGE_KEY, next)
                        } catch (error) {
                          console.error('Failed to save hourly rate', error)
                        }
                      }
                    }}
                    className="w-24 border-2 border-secondary pl-7"
                  />
                </div>
                <span className="text-sm text-gray-500">/hour</span>
              </div>
            )}
          </div>

          {/* Schedule Context Toggle */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule Blocks
            </Label>
            <div className="flex items-center gap-4 rounded-lg border-2 border-secondary p-3">
              <Switch checked={showScheduleContext} onCheckedChange={setShowScheduleContext} />
              <span className="text-sm">Show schedule context</span>
            </div>
            {showScheduleContext && (
              <p className="text-xs text-gray-500">Entries will display which schedule block they were logged from</p>
            )}
          </div>
        </div>

        {/* Active Date Range Display */}
        <div className="rounded-lg bg-gray-100 px-4 py-2 text-center font-mono text-sm">
          <span className="text-gray-600">Showing data from </span>
          <span className="font-semibold">{format(new Date(dateRange.startDate), 'MMM d, yyyy')}</span>
          <span className="text-gray-600"> to </span>
          <span className="font-semibold">{format(new Date(dateRange.endDate), 'MMM d, yyyy')}</span>
        </div>
      </div>

      {/* Report Content */}
      <div className="card-brutal min-h-[400px]">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loading size="sm" />
          </div>
        ) : viewType === 'detailed' && detailedQuery.data ? (
          <DetailedReportView
            dailyBreakdown={detailedQuery.data.dailyBreakdown}
            summary={detailedQuery.data.summary}
            billable={detailedQuery.data.billable}
            showBillable={includeBillable}
            showScheduleContext={showScheduleContext}
          />
        ) : viewType === 'summary' && summaryQuery.data ? (
          <SummaryReportView
            items={summaryQuery.data.items}
            dateBreakdown={summaryQuery.data.dateBreakdown}
            groupBy={summaryQuery.data.groupBy}
            summary={summaryQuery.data.summary}
            billable={summaryQuery.data.billable}
            showBillable={includeBillable}
          />
        ) : viewType === 'day_by_task' && dayByTaskQuery.data ? (
          <div className="p-6">
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
                              <span className={task.goalColor ? `text-[${task.goalColor}]` : ''}>{task.taskName}</span>
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
        ) : viewType === 'day_total' && dayTotalQuery.data ? (
          <div className="p-6">
            <h3 className="mb-4 text-lg font-bold">Day Total Report</h3>
            <div className="space-y-4">
              {dayTotalQuery.data.dailyBreakdown.map((day, i) => (
                <div key={i} className="border-2 border-gray-200 bg-white shadow-brutal">
                  {/* Day Header */}
                  <div className="flex items-center justify-between border-b-2 border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-900">
                        {format(new Date(day.date), 'EEEE, MMMM d')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-lg font-bold text-gray-900">{day.totalFormatted}</span>
                    </div>
                  </div>

                  {/* Goal Groups */}
                  <div className="divide-y divide-gray-100">
                    {day.goalGroups && day.goalGroups.length > 0 ? (
                      day.goalGroups.map((group, gi) => (
                        <div key={gi} className="flex items-start gap-3 px-4 py-3">
                          {/* Goal Color Indicator */}
                          <div
                            className="mt-1 h-4 w-4 flex-shrink-0 border-2 border-gray-800"
                            style={{ backgroundColor: group.goalColor || '#94a3b8' }}
                          />
                          {/* Goal Info */}
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-gray-900">{group.goalTitle}</div>
                            <div className="font-mono text-sm text-gray-600">{group.taskNames}</div>
                          </div>
                          {/* Goal Time */}
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
        ) : (
          <div className="flex h-64 items-center justify-center text-gray-500">
            Select a date range to view your report
          </div>
        )}
      </div>

      {/* Use Case Hints */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
          <h3 className="mb-2 font-bold text-blue-800">📝 For Invoicing</h3>
          <p className="text-sm text-blue-700">
            Use the Detailed View with billable hours enabled. Export as CSV for spreadsheet compatibility or PDF for
            professional invoices.
          </p>
        </div>
        <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
          <h3 className="mb-2 font-bold text-green-800">👨‍🏫 For Mentors/Teachers</h3>
          <p className="text-sm text-green-700">
            Summary View grouped by Goal shows progress at a glance. Detailed View provides complete activity logs for
            thorough review.
          </p>
        </div>
        <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4">
          <h3 className="mb-2 font-bold text-purple-800">🎓 For Students</h3>
          <p className="text-sm text-purple-700">
            Use Detailed View to show daily study sessions. Filter by specific courses or goals to generate assignment
            progress reports.
          </p>
        </div>
      </div>
    </div>
  )
}
