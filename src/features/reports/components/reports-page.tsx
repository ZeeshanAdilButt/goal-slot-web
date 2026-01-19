'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns'
import { Download, FileSpreadsheet, FileJson, FileText } from 'lucide-react'

import { FocusBreakdownCard } from '@/features/reports/components/focus-breakdown-card'
import { FocusCategoryPieCard } from '@/features/reports/components/focus-category-pie-card'
import { FocusFilters, emptyFilters, type ReportFilterState } from '@/features/reports/components/focus-filters'
import { FocusHourlyCard } from '@/features/reports/components/focus-hourly-card'
import { FocusTaskTotalCard } from '@/features/reports/components/focus-task-total-card'
import { FocusTimeGridCard } from '@/features/reports/components/focus-time-grid-card'
import { FocusTrendCard } from '@/features/reports/components/focus-trend-card'
import { useExportReportMutation } from '@/features/reports/hooks/use-detailed-summary-reports'
import type { FocusGranularity, ExportFormat } from '@/features/reports/utils/types'
import { useLocalStorage } from '@/hooks/use-local-storage'

import { cn, formatDuration } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const VIEW_TABS: Array<{ value: FocusGranularity; label: string }> = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
]

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
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportViewType, setExportViewType] = useState<'detailed' | 'summary' | 'day_by_task' | 'day_total'>('summary')
  const [exportTitle, setExportTitle] = useState('Time Report')
  const [exportNotes, setExportNotes] = useState('')
  
  const exportMutation = useExportReportMutation()
  
  const dateRange = useMemo(() => getDateRangeForView(view), [view])

  const handleExport = useCallback(
    async (exportFormat: ExportFormat) => {
      try {
        const result = await exportMutation.mutateAsync({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          viewType: exportViewType,
          groupBy: 'goal',
          format: exportFormat,
          title: exportTitle,
          notes: exportNotes || undefined,
        })

        if (exportFormat === 'csv' && result instanceof Blob) {
          const url = window.URL.createObjectURL(result)
          const a = document.createElement('a')
          a.href = url
          a.download = `time-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        } else if (exportFormat === 'json') {
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
           const data = result.data;
           
           // Calculate HTML content BEFORE opening the window.
           try {
             let itemsHtml = '';
             
             if (exportViewType === 'detailed') {
                itemsHtml = `
                  <table class="table">
                    <thead><tr><th>Date</th><th>Task</th><th>Goal</th><th>Duration</th></tr></thead>
                    <tbody>${(data.dailyBreakdown || []).map((d: any) => (d.entries || []).map((e: any) => `
                      <tr>
                        <td>${d.date}</td>
                        <td>${e.task?.title || e.taskName || '-'}</td>
                        <td>${e.goal?.title || '-'}</td>
                        <td>${formatDuration(e.duration)}</td>
                      </tr>`).join('')).join('')}
                    </tbody>
                  </table>`;
             } else if (exportViewType === 'day_by_task') {
                itemsHtml = `
                   <table class="table">
                    <thead><tr><th>Date</th><th>Task</th><th>Total</th></tr></thead>
                    <tbody>${(data.dailyBreakdown || []).map((d: any) => (d.tasks || []).map((t: any) => `
                      <tr>
                         <td>${d.date}</td>
                         <td>${t.taskName}</td>
                         <td>${t.totalFormatted}</td>
                      </tr>
                    `).join('')).join('')}</tbody>
                   </table>
                `;
             } else if (exportViewType === 'day_total') {
                itemsHtml = `
                   <table class="table">
                    <thead><tr><th>Date</th><th>Tasks Include</th><th>Total</th></tr></thead>
                    <tbody>${(data.dailyBreakdown || []).map((d: any) => `
                      <tr>
                         <td>${d.date}</td>
                         <td>${d.taskNames}</td>
                         <td>${d.totalFormatted}</td>
                      </tr>
                    `).join('')}</tbody>
                   </table>
                `;
             } else {
                 // Summary
                 itemsHtml = `
                  <table class="table">
                    <thead><tr><th>Name</th><th>Entries</th><th>Total</th></tr></thead>
                    <tbody>${(data.items || []).map((i: any) => `
                      <tr>
                        <td>${i.name}</td>
                        <td>${i.entriesCount}</td>
                        <td>${i.totalFormatted}</td>
                      </tr>`).join('')}
                    </tbody>
                  </table>`;
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
                     ${dateRange.label}<br/>
                     Generated on ${format(new Date(), 'MMM d, yyyy HH:mm')}
                   </div>
                   
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
                   </div>

                   ${itemsHtml}
                   
                   <script>
                      window.onload = () => {
                        setTimeout(() => {
                           window.print();
                        }, 100);
                      };
                   </script>
                 </body>
               </html>
             `;
             
             const printWindow = window.open('', '_blank');
             if (printWindow) {
               printWindow.document.open();
               printWindow.document.write(html);
               printWindow.document.close();
             }
           } catch (err) {
             console.error('Error generating PDF content:', err);
           }
        }

        setExportDialogOpen(false)
      } catch (error) {
        console.error('Export failed:', error)
      }
    },
    [exportMutation, dateRange, exportViewType, exportTitle, exportNotes]
  )

  return (
    <div className="space-y-8 p-2 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold uppercase">Focus</h1>
          <p className="font-mono uppercase text-gray-600">Visualize your focused time</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filters */}
          <FocusFilters filters={filters} onChange={setFilters} />

          {/* Group By Toggle */}
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as 'goal' | 'task')}>
            <SelectTrigger className="h-10 w-[130px] border-3 border-secondary bg-white">
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

          {/* View Toggle */}
          <div className="flex gap-2 rounded-lg border-3 border-secondary bg-white p-1 shadow-sm">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setView(tab.value)}
                className={cn(
                  'btn-brutal-secondary px-4 py-2 text-xs font-semibold uppercase shadow-none transition-colors',
                  view === tab.value && 'btn-brutal border-3 border-black shadow-[4px_4px_0_#000]',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Export Button */}
          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-brutal gap-2">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="border-3 border-secondary sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold uppercase">Export {view === 'day' ? 'Daily' : view === 'week' ? 'Weekly' : 'Monthly'} Report</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="rounded-lg bg-gray-100 px-4 py-2 text-center font-mono text-sm">
                  <span className="text-gray-600">Period: </span>
                  <span className="font-semibold">{dateRange.label}</span>
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Report Type</label>
                    <Select value={exportViewType} onValueChange={(v) => setExportViewType(v as 'detailed' | 'summary' | 'day_by_task' | 'day_total')}>
                      <SelectTrigger className="border-2 border-secondary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="summary">Summary</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                        <SelectItem value="day_by_task">Day by Task</SelectItem>
                        <SelectItem value="day_total">Day Total</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Report Title</label>
                    <Input
                      value={exportTitle}
                      onChange={(e) => setExportTitle(e.target.value)}
                      placeholder="Report Title"
                      className="border-2 border-secondary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <Textarea
                    value={exportNotes}
                    onChange={(e) => setExportNotes(e.target.value)}
                    placeholder="Additional notes..."
                    rows={3}
                    className="resize-none border-2 border-secondary"
                  />
                </div>

                <div className="text-center text-xs text-gray-500">
                  Need more options?{' '}
                  <Link href="/dashboard/reports/export" className="text-primary underline hover:no-underline">
                    Advanced Export
                  </Link>
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
      </div>

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
    </div>
  )
}
