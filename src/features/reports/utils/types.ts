export interface FocusGoal {
  id: string
  title: string
  color?: string
  category?: string
}

export interface FocusTimeEntry {
  id: string
  taskName: string
  duration: number
  date: string
  startedAt?: string | null

  goalId?: string | null
  goal?: FocusGoal | null

  scheduleBlockId?: string | null
  scheduleBlock?: {
    id: string
    title: string
    category: string
  } | null

  taskId?: string | null
  taskTitle?: string | null
  task?: {
    id: string
    title: string
    category: string | null
  } | null
}

export type FocusGroupBy = 'goal' | 'task'
export type FocusGranularity = 'day' | 'week' | 'month'
export type FocusPeriod = 'day' | 'week' | 'month'

// New types for enhanced reports

export type ReportViewType = 'detailed' | 'summary' | 'day_by_task' | 'day_total'
export type ReportGroupBy = 'goal' | 'task' | 'date' | 'category'
export type ReportSortBy = 'date_asc' | 'date_desc' | 'duration_asc' | 'duration_desc' | 'goal' | 'task'
export type ExportFormat = 'csv' | 'pdf' | 'json'

export interface ReportFilters {
  startDate: string
  endDate: string
  viewType?: ReportViewType
  groupBy?: ReportGroupBy
  goalIds?: string[]
  taskIds?: string[]
  category?: string
  sortBy?: ReportSortBy
  includeBillable?: boolean
  hourlyRate?: number
}

export interface ExportReportParams extends ReportFilters {
  format: ExportFormat
  title?: string
  includeClientInfo?: boolean
  clientName?: string
  projectName?: string
  notes?: string
}

export interface DetailedTimeEntry {
  id: string
  date: string
  dayOfWeek: string
  startedAt: string | null
  endedAt: string | null
  taskName: string
  duration: number
  durationFormatted: string
  notes: string | null
  goal: { id: string; title: string; color: string } | null
  task: { id: string; title: string } | null
  category: string | null
}

export interface DailyBreakdown {
  date: string
  dayOfWeek: string
  entries: DetailedTimeEntry[]
  totalMinutes: number
  totalFormatted: string
}

export interface BillableInfo {
  hourlyRate: number
  totalHours: number
  totalAmount: number
  currency: string
}

export interface DetailedReportResponse {
  reportType: 'detailed'
  startDate: string
  endDate: string
  generatedAt: string
  filters: {
    goalIds?: string[]
    taskIds?: string[]
    category?: string
  }
  summary: {
    totalMinutes: number
    totalFormatted: string
    totalHours: number
    totalEntries: number
    daysWithEntries: number
    avgMinutesPerDay: number
  }
  billable: BillableInfo | null
  dailyBreakdown: DailyBreakdown[]
}

export interface SummaryItem {
  id: string
  name: string
  color?: string
  totalMinutes: number
  totalFormatted: string
  totalHours: number
  percentage: number
  entriesCount: number
  billableAmount?: number
}

export interface DateBreakdownItem {
  date: string
  minutes: number
  formatted: string
}

export interface SummaryReportResponse {
  reportType: 'summary'
  startDate: string
  endDate: string
  generatedAt: string
  groupBy: ReportGroupBy
  filters: {
    goalIds?: string[]
    taskIds?: string[]
    category?: string
  }
  summary: {
    totalMinutes: number
    totalFormatted: string
    totalHours: number
    totalEntries: number
    uniqueDays: number
  }
  billable: BillableInfo | null
  items: SummaryItem[]
  dateBreakdown: DateBreakdownItem[]
}

export interface FilterableGoal {
  id: string
  title: string
  color: string
  category: string | null
  isActive: boolean
}

export interface FilterableTask {
  id: string
  title: string
  category: string | null
  status: string
  goalId: string | null
}

// Report by Day by Task - shows aggregated hours per task per day
export interface DayByTaskEntry {
  taskName: string
  taskId: string | null
  goalTitle: string | null
  goalColor: string | null
  totalMinutes: number
  totalFormatted: string
}

export interface DayByTaskBreakdown {
  date: string
  dayOfWeek: string
  tasks: DayByTaskEntry[]
  totalMinutes: number
  totalFormatted: string
}

export interface DayByTaskReportResponse {
  reportType: 'day_by_task'
  startDate: string
  endDate: string
  generatedAt: string
  filters: {
    goalIds?: string[]
    taskIds?: string[]
    category?: string
  }
  summary: {
    totalMinutes: number
    totalFormatted: string
    totalHours: number
    totalEntries: number
    uniqueDays: number
  }
  billable: BillableInfo | null
  dailyBreakdown: DayByTaskBreakdown[]
}

// Report by Day - shows total hours per day with merged task names
export interface DayTotalBreakdown {
  date: string
  dayOfWeek: string
  taskNames: string // Comma-separated unique task names
  totalMinutes: number
  totalFormatted: string
  totalHours: number
}

export interface DayTotalReportResponse {
  reportType: 'day_total'
  startDate: string
  endDate: string
  generatedAt: string
  filters: {
    goalIds?: string[]
    taskIds?: string[]
    category?: string
  }
  summary: {
    totalMinutes: number
    totalFormatted: string
    totalHours: number
    totalEntries: number
    uniqueDays: number
  }
  billable: BillableInfo | null
  dailyBreakdown: DayTotalBreakdown[]
}


