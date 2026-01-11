import type { FocusGranularity, FocusPeriod } from '@/features/reports/utils/types'
import { addDays, addMonths, addWeeks, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns'

export function toDateOnlyString(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function getDateOnlyFromIsoString(value: string): string {
  return value.includes('T') ? value.split('T')[0] : value
}

export function getRollingRange({ granularity, offset }: { granularity: FocusGranularity; offset: number }): {
  startDate: string
  endDate: string
  label: string
} {
  const today = new Date()

  const windowSizes: Record<FocusGranularity, number> = {
    day: 14,
    week: 12,
    month: 12,
  }

  const windowSize = windowSizes[granularity]

  if (granularity === 'day') {
    const end = addDays(today, offset)
    const start = addDays(end, -(windowSize - 1))
    return {
      startDate: toDateOnlyString(start),
      endDate: toDateOnlyString(end),
      label: `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`,
    }
  }

  if (granularity === 'week') {
    const end = addWeeks(today, offset)
    const start = addWeeks(startOfWeek(end, { weekStartsOn: 1 }), -(windowSize - 1))
    return {
      startDate: toDateOnlyString(start),
      endDate: toDateOnlyString(end),
      label: `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`,
    }
  }

  const end = addMonths(today, offset)
  const start = startOfMonth(addMonths(end, -(windowSize - 1)))
  return {
    startDate: toDateOnlyString(start),
    endDate: toDateOnlyString(end),
    label: `${format(start, 'MMM yyyy')} - ${format(end, 'MMM yyyy')}`,
  }
}

export function getPeriodRange({ period, offset }: { period: FocusPeriod; offset: number }): {
  startDate: string
  endDate: string
  label: string
  days: string[]
} {
  const now = new Date()

  if (period === 'day') {
    const anchor = addDays(now, offset)
    const day = toDateOnlyString(anchor)

    return {
      startDate: day,
      endDate: day,
      label: format(anchor, 'MMM d'),
      days: [day],
    }
  }

  if (period === 'week') {
    const anchor = addWeeks(now, offset)
    const start = startOfWeek(anchor, { weekStartsOn: 1 })
    const end = endOfWeek(anchor, { weekStartsOn: 1 })
    const days: string[] = []
    for (let i = 0; i < 7; i++) {
      days.push(toDateOnlyString(addDays(start, i)))
    }

    return {
      startDate: toDateOnlyString(start),
      endDate: toDateOnlyString(end),
      label: `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`,
      days,
    }
  }

  const anchor = addMonths(now, offset)
  const start = startOfMonth(anchor)
  const end = endOfMonth(anchor)
  const days: string[] = []
  const dayCount = Number(format(end, 'd'))
  for (let i = 0; i < dayCount; i++) {
    days.push(toDateOnlyString(addDays(start, i)))
  }

  return {
    startDate: toDateOnlyString(start),
    endDate: toDateOnlyString(end),
    label: format(start, 'MMMM yyyy'),
    days,
  }
}
