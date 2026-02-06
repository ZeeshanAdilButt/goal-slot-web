'use client'

import { useState } from 'react'

import { fetchSharedUserTimeEntries } from '@/features/sharing/utils/queries'
import type { SharedTimeEntry } from '@/features/sharing/utils/types'
import { Download } from 'lucide-react'

import { dateRangeValueToRange, getDefaultDateRangeValue } from '@/lib/date-range-utils'
import { formatDuration } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import DateRangePicker from '@/components/DateRangePicker'
import type { DateRangeValue } from '@/components/DateRangePicker/types'

function buildAndDownloadCSV(entries: SharedTimeEntry[], fileName: string): void {
  const headers = ['Date', 'Duration', 'Goal', 'Task']
  const rows = entries.map((entry) => [
    entry.date,
    formatDuration(entry.duration),
    entry.goal?.title || '',
    entry.taskName || '',
  ])

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n')
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
}

export function SharedReportExport({ userId, userName }: SharedReportExportProps) {
  const [dateRangeValue, setDateRangeValue] = useState<DateRangeValue>(getDefaultDateRangeValue)
  const [isExporting, setIsExporting] = useState(false)

  const exportDateRange = dateRangeValueToRange(dateRangeValue, { withLabel: true })

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
      <DateRangePicker value={dateRangeValue} onChange={setDateRangeValue} allowClearing={false} align="start" />

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
