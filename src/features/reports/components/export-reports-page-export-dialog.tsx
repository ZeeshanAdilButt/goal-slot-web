'use client'

import { useCallback, useState } from 'react'
import { format } from 'date-fns'
import { Download, FileJson, FileSpreadsheet, FileText } from 'lucide-react'

import { useExportReportMutation } from '@/features/reports/hooks/use-detailed-summary-reports'
import type { ExportFormat, ReportFilters, ReportViewType } from '@/features/reports/utils/types'
import { escapeHtml } from '@/lib/escape-html'
import { formatDuration } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export interface ExportReportsPageExportDialogProps {
  filters: ReportFilters
  dateRange: { startDate: string; endDate: string }
  viewType: ReportViewType
  trigger?: React.ReactNode
}

export function ExportReportsPageExportDialog({
  filters,
  dateRange,
  viewType,
  trigger,
}: ExportReportsPageExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [exportTitle, setExportTitle] = useState('Time Report')
  const [exportClientName, setExportClientName] = useState('')
  const [exportProjectName, setExportProjectName] = useState('')
  const [exportNotes, setExportNotes] = useState('')

  const exportMutation = useExportReportMutation()

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

            if (viewType === 'detailed') {
              itemsHtml = `
                  <table class="table">
                    <thead><tr><th>Date</th><th>Task</th><th>Goal</th><th>Duration</th><th>Notes</th><th>Task Notes</th></tr></thead>
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
                        <td>${escapeHtml(e.notes || '')}</td>
                        <td>${escapeHtml(e.taskNotes || '')}</td>
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
            } else if (viewType === 'day_total') {
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
                     @media print { body { padding: 0; max-width: none; } .summary-box, .notes { border: 1px solid #ccc !important; -webkit-print-color-adjust: exact; } }
                   </style>
                 </head>
                 <body>
                   <h1>${escapeHtml(exportTitle)}</h1>
                   <div class="meta">
                     Report: ${escapeHtml(viewType.replace(/_/g, ' ').toUpperCase())}<br/>
                     ${escapeHtml(format(new Date(dateRange.startDate), 'MMM d'))} - ${escapeHtml(format(new Date(dateRange.endDate), 'MMM d, yyyy'))}<br/>
                     Generated on ${escapeHtml(format(new Date(), 'MMM d, yyyy HH:mm'))}
                   </div>
                   ${exportClientName || exportProjectName ? `
                     <div class="meta" style="margin-top: -1rem; margin-bottom: 2rem;">
                       ${exportClientName ? `<div><strong>Client:</strong> ${escapeHtml(exportClientName)}</div>` : ''}
                       ${exportProjectName ? `<div><strong>Project:</strong> ${escapeHtml(exportProjectName)}</div>` : ''}
                     </div>
                   ` : ''}
                   ${exportNotes ? `<div class="notes"><strong>Notes:</strong><br/>${escapeHtml(exportNotes)}</div>` : ''}
                   <div class="summary-box">
                      <div><strong>Total Time</strong><br/>${escapeHtml(data.summary?.totalFormatted || '0h 0m')}</div>
                      <div><strong>Total Entries</strong><br/>${escapeHtml(data.summary?.totalEntries ?? 0)}</div>
                      ${data.billable ? `<div><strong>Billable Amount</strong><br/>$${escapeHtml(data.billable.totalAmount)}</div>` : ''}
                   </div>
                   ${itemsHtml}
                   <script>window.onload = () => { setTimeout(() => window.print(), 100); };<\/script>
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
    [
      exportMutation,
      filters,
      dateRange,
      viewType,
      exportTitle,
      exportClientName,
      exportProjectName,
      exportNotes,
    ],
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="btn-brutal gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        )}
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
  )
}
