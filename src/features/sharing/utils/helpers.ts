import { SharedReportsStats, SharedTimeEntry, WeekRange } from '@/features/sharing/utils/types'

import { formatDate, formatDuration } from '@/lib/utils'

/**
 * Calculate a rolling week range based on an offset from the current week.
 * @param offset - Number of weeks to offset (0 = current week, -1 = last week, etc.)
 * @returns Week range with start date, end date, and formatted label
 */
export function getRollingWeekRange(offset: number = 0): WeekRange {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + offset * 7)
  startOfWeek.setHours(0, 0, 0, 0)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  return {
    startDate: startOfWeek.toISOString().split('T')[0],
    endDate: endOfWeek.toISOString().split('T')[0],
    label: `${formatDate(startOfWeek, 'MMM d')} - ${formatDate(endOfWeek, 'MMM d, yyyy')}`,
  }
}

/**
 * Calculate statistics from shared time entries.
 * @param entries - Array of shared time entries
 * @returns Calculated statistics including totals, averages, daily breakdown, and goal breakdown
 */
export function calculateStatistics(entries: SharedTimeEntry[]): SharedReportsStats {
  const totalMinutes = entries.reduce((sum, e) => sum + e.duration, 0)
  const daysWithEntries = new Set(entries.map((e) => e.date)).size
  const avgPerDay = daysWithEntries > 0 ? Math.round(totalMinutes / daysWithEntries) : 0

  // Daily breakdown
  const dailyMinutes: Record<string, number> = {}
  entries.forEach((e) => {
    dailyMinutes[e.date] = (dailyMinutes[e.date] || 0) + e.duration
  })

  // Goal breakdown
  const goalMinutes: Record<string, { title: string; color: string; minutes: number }> = {}
  entries.forEach((e) => {
    const goalId = e.goal?.id || 'other'
    if (!goalMinutes[goalId]) {
      goalMinutes[goalId] = {
        title: e.goal?.title || 'Other',
        color: e.goal?.color || '#94A3B8',
        minutes: 0,
      }
    }
    goalMinutes[goalId].minutes += e.duration
  })

  return {
    totalMinutes,
    totalFormatted: formatDuration(totalMinutes),
    daysActive: daysWithEntries,
    avgPerDay,
    avgFormatted: formatDuration(avgPerDay),
    entriesCount: entries.length,
    dailyData: Object.entries(dailyMinutes)
      .map(([date, minutes]) => ({
        date,
        minutes,
        label: formatDate(date, 'EEE'),
      }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    goalData: Object.values(goalMinutes).sort((a, b) => b.minutes - a.minutes),
  }
}
