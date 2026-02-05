'use client'

import { useEffect, useMemo, useState } from 'react'

import { getPeriodRange } from '@/features/reports/utils/dates'
import type { FocusGranularity } from '@/features/reports/utils/types'
import { fetchSharedUserTimeEntries } from '@/features/sharing/utils/queries'
import type { SharedTimeEntry } from '@/features/sharing/utils/types'
import { Download } from 'lucide-react'

import { cn, formatDuration } from '@/lib/utils'
import { Button } from '@/components/ui/button'

function buildAndDownloadCSV(entries: SharedTimeEntry[], fileName: string): void {
  const headers = ['Date', 'Duration', 'Goal', 'Task']
  const rows = entries.map((entry) => [
    entry.date,
    formatDuration(entry.duration),
    entry.goal?.title || '',
    entry.taskName || '',
  ])

  const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

interface SharedReportExportProps {
  userId: string
  userName: string
  view: FocusGranularity
}

export function SharedReportExport({ userId, userName, view }: SharedReportExportProps) {
  const [exportOffset, setExportOffset] = useState(0)
  const [isExporting, setIsExporting] = useState(false)

  const exportDateRange = useMemo(
    () => getPeriodRange({ period: view, offset: exportOffset }),
    [view, exportOffset],
  )

  useEffect(() => {
    setExportOffset(0)
  }, [view])

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const data = await fetchSharedUserTimeEntries(userId, exportDateRange.startDate, exportDateRange.endDate)
      const rawEntries: SharedTimeEntry[] = Array.isArray(data) ? data : []

      const fileName = `${userName}-time-report-${exportDateRange.startDate}-to-${exportDateRange.endDate}.csv`
      buildAndDownloadCSV(rawEntries, fileName)
    } catch (err) {
      console.error('Export shared report CSV failed:', err)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-row flex-wrap items-center justify-between gap-3 lg:justify-end">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
        <span className="font-mono text-xs text-gray-600 sm:text-sm">Export:</span>
        <div className="flex items-center gap-1 rounded-lg border-2 border-secondary bg-background px-2 py-1">
          <button
            type="button"
            onClick={() => setExportOffset((o) => o - 1)}
            className="btn-brutal-secondary px-2 py-1 text-xs font-bold"
          >
            Prev
          </button>
          <span className="min-w-[120px] font-mono text-xs font-bold text-gray-900 sm:text-sm">
            {exportDateRange.label}
          </span>
          <button
            type="button"
            onClick={() => setExportOffset((o) => Math.min(o + 1, 0))}
            disabled={exportOffset >= 0}
            className={cn(
              'btn-brutal-secondary px-2 py-1 text-xs font-bold',
              exportOffset >= 0 && 'cursor-not-allowed opacity-50',
            )}
          >
            Next
          </button>
        </div>
      </div>

      <div className="hidden h-8 w-0.5 bg-gray-200 sm:block" />

      <Button
        variant="outline"
        size="default"
        className="h-10 gap-2 border-2 border-secondary bg-white font-bold hover:bg-gray-50"
        onClick={handleExport}
        disabled={isExporting}
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Export</span>
      </Button>
    </div>
  )
}
