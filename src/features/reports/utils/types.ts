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
  showScheduleContext?: boolean
  includeTaskNotes?: boolean
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
  taskNotes: string | null
  goal: { id: string; title: string; color: string } | null
  task: { id: string; title: string } | null
  category: string | null
  scheduleBlock?: {
    id: string
    title: string
    startTime: string
    endTime: string
    color?: string
  } | null
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

// Report by Day - shows total hours per day with tasks grouped by goal
export interface DayTotalGoalGroup {
  goalId: string | null
  goalTitle: string
  goalColor: string | null
  taskNames: string // Comma-separated unique task names for this goal
  totalMinutes: number
  totalFormatted: string
}

export interface DayTotalBreakdown {
  date: string
  dayOfWeek: string
  taskNames: string // Comma-separated unique task names (all goals combined for backward compat)
  goalGroups: DayTotalGoalGroup[] // Tasks grouped by goal
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

// ==========================================
// Schedule-Based Report Types ("Beautify by Schedule")
// ==========================================

export interface SchedulePattern {
  /** Unique key for the pattern (e.g., "Deep Work|09:00-18:00") */
  patternKey: string
  /** Title of the schedule block */
  title: string
  /** Start time in HH:mm format */
  startTime: string
  /** End time in HH:mm format */
  endTime: string
  /** Category of the schedule block */
  category?: string
  /** Color of the schedule block */
  color?: string
  /** Goal associated with this schedule block */
  goalTitle?: string
  goalColor?: string
  /** Days of week this pattern appears (0=Sun, 1=Mon, etc.) */
  daysOfWeek: number[]
  /** Formatted display string e.g., "9:00 AM - 6:00 PM" */
  timeRangeFormatted: string
}

export interface ScheduleDayData {
  /** Date string (YYYY-MM-DD) */
  date: string
  /** Day of week (Mon, Tue, etc.) */
  dayOfWeek: string
  /** Day number (0-6) */
  dayNumber: number
  /** Minutes logged during this schedule on this day */
  loggedMinutes: number
  /** Formatted logged time */
  loggedFormatted: string
  /** Expected minutes based on schedule duration */
  expectedMinutes: number
  /** Completion percentage */
  percentage: number
  /** Tasks worked on during this schedule slot */
  tasks: Array<{
    taskName: string
    minutes: number
    formatted: string
  }>
}

export interface ScheduleReportRow {
  /** The schedule pattern this row represents */
  pattern: SchedulePattern
  /** Data for each day in the report range */
  days: ScheduleDayData[]
  /** Total minutes logged across all days for this schedule */
  totalLogged: number
  totalLoggedFormatted: string
  /** Total expected minutes (schedule duration * active days) */
  totalExpected: number
  /** Overall completion percentage */
  overallPercentage: number
}

export interface ScheduleReportResponse {
  reportType: 'schedule'
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
    totalExpectedMinutes: number
    totalExpectedFormatted: string
    overallPercentage: number
    totalEntries: number
    schedulesTracked: number
  }
  /** Days included in the report (for column headers) */
  days: Array<{
    date: string
    dayOfWeek: string
    dayNumber: number
  }>
  /** Rows grouped by schedule pattern */
  rows: ScheduleReportRow[]
}


