'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'

import { useExportReportMutation } from '@/features/reports/hooks/use-detailed-summary-reports'
import type { ExportFormat, FocusGranularity } from '@/features/reports/utils/types'
import { format } from 'date-fns'
import { Download, FileJson, FileSpreadsheet, FileText } from 'lucide-react'

import { escapeHtml } from '@/lib/escape-html'
import { formatDuration } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export interface FocusReportExportDialogProps {
  /** Current view for dialog title and date range. */
  view: FocusGranularity
  /** Date range for the current view. */
  dateRange: { startDate: string; endDate: string; label: string }
  /** Optional trigger element; defaults to Export button. */
  trigger?: React.ReactNode
}

export function FocusReportExportDialog({ view, dateRange, trigger }: FocusReportExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [exportViewType, setExportViewType] = useState<'detailed' | 'summary' | 'day_by_task' | 'day_total'>('summary')
  const [exportTitle, setExportTitle] = useState('Time Report')
  const [exportNotes, setExportNotes] = useState('')
  const [includeTaskNotes, setIncludeTaskNotes] = useState(false)

  const exportMutation = useExportReportMutation()

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
          includeTaskNotes,
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
          const data = result.data
          try {
            let itemsHtml = ''

            if (exportViewType === 'detailed') {
              itemsHtml = `
                  <table class="table">
                    <thead><tr><th>Date</th><th>Task</th><th>Goal</th><th>Duration</th></tr></thead>
                    <tbody>${(data.dailyBreakdown || [])
                      .map((d: any) =>
                        (d.entries || [])
                          .map(
                            (e: any) => `
                      <tr>
                        <td>${escapeHtml(d.date)}</td>
                        <td>${escapeHtml(e.task?.title || e.taskName || '-')}</td>
                        <td>${escapeHtml(e.goal?.title || '-')}</td>
                        <td>${escapeHtml(formatDuration(e.duration))}</td>
                      </tr>`,
                          )
                          .join(''),
                      )
                      .join('')}
                    </tbody>
                  </table>`
            } else if (exportViewType === 'day_by_task') {
              itemsHtml = `
                   <table class="table">
                    <thead><tr><th>Date</th><th>Task</th><th>Total</th></tr></thead>
                    <tbody>${(data.dailyBreakdown || [])
                      .map((d: any) =>
                        (d.tasks || [])
                          .map(
                            (t: any) => `
                      <tr>
                         <td>${escapeHtml(d.date)}</td>
                         <td>${escapeHtml(t.taskName)}</td>
                         <td>${escapeHtml(t.totalFormatted)}</td>
                      </tr>
                    `,
                          )
                          .join(''),
                      )
                      .join('')}</tbody>
                   </table>
                `
            } else if (exportViewType === 'day_total') {
              itemsHtml = `
                   <table class="table">
                    <thead><tr><th>Date</th><th>Tasks Include</th><th>Total</th></tr></thead>
                    <tbody>${(data.dailyBreakdown || [])
                      .map(
                        (d: any) => `
                      <tr>
                         <td>${escapeHtml(d.date)}</td>
                         <td>${escapeHtml(d.taskNames)}</td>
                         <td>${escapeHtml(d.totalFormatted)}</td>
                      </tr>
                    `,
                      )
                      .join('')}</tbody>
                   </table>
                `
            } else {
              itemsHtml = `
                  <table class="table">
                    <thead><tr><th>Name</th><th>Entries</th><th>Total</th></tr></thead>
                    <tbody>${(data.items || [])
                      .map(
                        (i: any) => `
                      <tr>
                        <td>${escapeHtml(i.name)}</td>
                        <td>${escapeHtml(i.entriesCount)}</td>
                        <td>${escapeHtml(i.totalFormatted)}</td>
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
                   <title>${escapeHtml(exportTitle)}</title>
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
                   <h1>${escapeHtml(exportTitle)}</h1>
                   <div class="meta">
                     ${escapeHtml(dateRange.label)}<br/>
                     Generated on ${escapeHtml(format(new Date(), 'MMM d, yyyy HH:mm'))}
                   </div>
                   
                   ${exportNotes ? `<div class="notes"><strong>Notes:</strong><br/>${escapeHtml(exportNotes)}</div>` : ''}
                   
                   <div class="summary-box">
                      <div>
                        <strong>Total Time</strong><br/>
                        ${escapeHtml(data.summary?.totalFormatted || '0h 0m')}
                      </div>
                      <div>
                        <strong>Total Entries</strong><br/>
                        ${escapeHtml(data.summary?.totalEntries ?? 0)}
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
             `

            const printWindow = window.open('', '_blank')
            if (printWindow) {
              printWindow.document.open()
              printWindow.document.write(html)
              printWindow.document.close()
            }
          } catch (err) {
            console.error('Error generating PDF content:', err)
          }
        }

        setOpen(false)
      } catch (error) {
        console.error('Export failed:', error)
      }
    },
    [exportMutation, dateRange, exportViewType, exportTitle, exportNotes, includeTaskNotes],
  )

  const viewLabel = view === 'day' ? 'Daily' : view === 'week' ? 'Weekly' : 'Monthly'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="btn-brutal h-10 gap-2 px-4">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="border-3 border-secondary sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold uppercase">Export {viewLabel} Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-gray-100 px-4 py-2 text-center font-mono text-sm">
            <span className="text-gray-600">Period: </span>
            <span className="font-semibold">{dateRange.label}</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select
                value={exportViewType}
                onValueChange={(v) => setExportViewType(v as 'detailed' | 'summary' | 'day_by_task' | 'day_total')}
              >
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

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={includeTaskNotes}
                onChange={(e) => setIncludeTaskNotes(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Include task notes in report</span>
            </label>
            {includeTaskNotes && (
              <p className="text-xs text-gray-500">Task-specific notes will be shown in the exported report</p>
            )}
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
          <Button onClick={() => handleExport('pdf')} disabled={exportMutation.isPending} className="gap-2 sm:flex-1">
            <FileText className="h-4 w-4" />
            Print PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
