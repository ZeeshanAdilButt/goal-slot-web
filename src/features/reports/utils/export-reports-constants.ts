import type { ReportGroupBy, ReportViewType } from '@/features/reports/utils/types'

export const HOURLY_RATE_STORAGE_KEY = 'reportsHourlyRate'

export const VIEW_TYPE_OPTIONS: Array<{ value: ReportViewType; label: string; description: string }> = [
  { value: 'detailed', label: 'Detailed View', description: 'Shows every entry with timestamps' },
  { value: 'summary', label: 'Summary View', description: 'Compact aggregated totals' },
  { value: 'day_by_task', label: 'Day by Task', description: 'Hours per task per day (aggregated)' },
  { value: 'day_total', label: 'Day Total', description: 'Total hours per day with task list' },
]

export const GROUP_BY_OPTIONS: Array<{ value: ReportGroupBy; label: string }> = [
  { value: 'goal', label: 'By Goal' },
  { value: 'task', label: 'By Task' },
  { value: 'category', label: 'By Category' },
  { value: 'date', label: 'By Date' },
]
