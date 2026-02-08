import { endOfWeek, format, parseISO, startOfWeek } from 'date-fns'

import type { DateRangeValue } from '@/components/DateRangePicker/types'

const WEEK_STARTS_ON = 1 as const

/**
 * Returns the current week as a DateRangeValue (yyyy-MM-dd from/to).
 * Used as the default value for the DateRangePicker.
 */
export function getDefaultDateRangeValue(): DateRangeValue {
  const today = new Date()
  const start = startOfWeek(today, { weekStartsOn: WEEK_STARTS_ON })
  const end = endOfWeek(today, { weekStartsOn: WEEK_STARTS_ON })
  return { from: format(start, 'yyyy-MM-dd'), to: format(end, 'yyyy-MM-dd') }
}

/**
 * Resolves a DateRangeValue to startDate/endDate strings, falling back to the current week when missing.
 * Optionally includes a human-readable label for display.
 */
export function dateRangeValueToRange(
  value: DateRangeValue,
  options?: { withLabel: true },
): { startDate: string; endDate: string; label: string }
export function dateRangeValueToRange(
  value: DateRangeValue,
  options?: { withLabel?: false },
): { startDate: string; endDate: string }
export function dateRangeValueToRange(
  value: DateRangeValue,
  options?: { withLabel?: boolean },
): { startDate: string; endDate: string; label?: string } {
  const today = new Date()
  const start = startOfWeek(today, { weekStartsOn: WEEK_STARTS_ON })
  const end = endOfWeek(today, { weekStartsOn: WEEK_STARTS_ON })
  const startDate = value.from ?? format(start, 'yyyy-MM-dd')
  const endDate = value.to ?? format(end, 'yyyy-MM-dd')
  const result: { startDate: string; endDate: string; label?: string } = {
    startDate,
    endDate,
  }
  if (options?.withLabel) {
    const startY = parseISO(startDate).getFullYear()
    const endY = parseISO(endDate).getFullYear()
    const startFormat = startY !== endY ? 'MMM d, yyyy' : 'MMM d'
    result.label = `${format(parseISO(startDate), startFormat)} - ${format(parseISO(endDate), 'MMM d, yyyy')}`
  }
  return result
}
