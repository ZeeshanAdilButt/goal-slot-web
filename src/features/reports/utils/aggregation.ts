import { getDateOnlyFromIsoString, toDateOnlyString } from '@/features/reports/utils/dates'
import type { FocusGranularity, FocusGroupBy, FocusTimeEntry } from '@/features/reports/utils/types'
import { addDays, addMinutes, addMonths, addWeeks, format, parseISO, startOfMonth, startOfWeek } from 'date-fns'

import { COLOR_OPTIONS, formatDuration } from '@/lib/utils'

const DEFAULT_OTHER_COLOR = '#94A3B8'

export function normalizeTaskName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
}

function getEntryDayString(entry: FocusTimeEntry): string {
  return getDateOnlyFromIsoString(entry.date)
}

function getBucketKey(dayString: string, granularity: FocusGranularity): string {
  const day = parseISO(dayString)
  if (granularity === 'day') return toDateOnlyString(day)
  if (granularity === 'week') return toDateOnlyString(startOfWeek(day, { weekStartsOn: 1 }))
  return toDateOnlyString(startOfMonth(day))
}

function getBucketLabel(bucketKey: string, granularity: FocusGranularity): string {
  const d = parseISO(bucketKey)
  if (granularity === 'day') return format(d, 'MMM d')
  if (granularity === 'week') return format(d, 'MMM d')
  return format(d, 'MMM yy')
}

function listBucketKeys({
  granularity,
  startDate,
  endDate,
}: {
  granularity: FocusGranularity
  startDate?: string
  endDate?: string
}): string[] {
  if (!startDate || !endDate) return []

  if (granularity === 'day') {
    const start = parseISO(startDate)
    const end = parseISO(endDate)
    const keys: string[] = []
    let cursor = start
    while (cursor <= end) {
      keys.push(toDateOnlyString(cursor))
      cursor = addDays(cursor, 1)
    }
    return keys
  }

  if (granularity === 'week') {
    const start = startOfWeek(parseISO(startDate), { weekStartsOn: 1 })
    const end = startOfWeek(parseISO(endDate), { weekStartsOn: 1 })
    const keys: string[] = []
    let cursor = start
    while (cursor <= end) {
      keys.push(toDateOnlyString(cursor))
      cursor = addWeeks(cursor, 1)
    }
    return keys
  }

  const start = startOfMonth(parseISO(startDate))
  const end = startOfMonth(parseISO(endDate))
  const keys: string[] = []
  let cursor = start
  while (cursor <= end) {
    keys.push(toDateOnlyString(cursor))
    cursor = addMonths(cursor, 1)
  }
  return keys
}

function makeGroupInfo({ groupBy, entry }: { groupBy: FocusGroupBy; entry: FocusTimeEntry }): {
  key: string
  label: string
  color?: string
} {
  if (groupBy === 'goal') {
    if (entry.goalId && entry.goal?.title) {
      return {
        key: `goal:${entry.goalId}`,
        label: entry.goal.title,
        color: entry.goal.color,
      }
    }
    return { key: 'goal:none', label: 'No goal', color: DEFAULT_OTHER_COLOR }
  }

  if (entry.taskId) {
    return {
      key: `task:${entry.taskId}`,
      label: entry.taskTitle || entry.taskName,
    }
  }

  const normalized = normalizeTaskName(entry.taskName)
  return { key: `taskname:${normalized}`, label: entry.taskName.trim() }
}

export function buildStackedSeries({
  entries,
  granularity,
  groupBy,
  topN,
  startDate,
  endDate,
}: {
  entries: FocusTimeEntry[]
  granularity: FocusGranularity
  groupBy: FocusGroupBy
  topN: number
  startDate?: string
  endDate?: string
}): {
  data: Array<Record<string, number | string>>
  stacks: Array<{ key: string; label: string; color: string }>
  totalMinutes: number
} {
  const bucketKeys = new Set<string>()
  const groupTotals = new Map<string, number>()
  const groupMeta = new Map<string, { label: string; color?: string }>()
  const bucketGroupMinutes = new Map<string, Map<string, number>>()

  let totalMinutes = 0

  for (const entry of entries) {
    const dayString = getEntryDayString(entry)
    const bucketKey = getBucketKey(dayString, granularity)
    const { key: groupKey, label, color } = makeGroupInfo({ groupBy, entry })

    bucketKeys.add(bucketKey)
    totalMinutes += entry.duration

    groupMeta.set(groupKey, { label, color })
    groupTotals.set(groupKey, (groupTotals.get(groupKey) || 0) + entry.duration)

    if (!bucketGroupMinutes.has(bucketKey)) bucketGroupMinutes.set(bucketKey, new Map())
    const bucketMap = bucketGroupMinutes.get(bucketKey)!
    bucketMap.set(groupKey, (bucketMap.get(groupKey) || 0) + entry.duration)
  }

  const sortedBuckets =
    startDate && endDate ? listBucketKeys({ granularity, startDate, endDate }) : Array.from(bucketKeys).sort()

  const sortedGroups = Array.from(groupTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key)

  const selectedGroupKeys = sortedGroups.slice(0, topN)
  const hasOther = sortedGroups.length > selectedGroupKeys.length
  const otherKey = hasOther ? `${groupBy}:other` : null

  const tasksPalette = [...COLOR_OPTIONS, '#06B6D4', '#8B5CF6', '#F97316', '#3B82F6']

  const stacks: Array<{ key: string; label: string; color: string }> = []

  selectedGroupKeys.forEach((key, idx) => {
    const meta = groupMeta.get(key)
    const fallbackColor = tasksPalette[idx % tasksPalette.length]
    const color = meta?.color || fallbackColor
    stacks.push({ key, label: meta?.label || key, color })
  })

  if (otherKey) {
    stacks.push({ key: otherKey, label: 'Other', color: DEFAULT_OTHER_COLOR })
  }

  const data = sortedBuckets.map((bucketKey) => {
    const row: Record<string, number | string> = {
      bucketKey,
      bucketLabel: getBucketLabel(bucketKey, granularity),
      totalMinutes: 0,
    }

    const bucketMap = bucketGroupMinutes.get(bucketKey) || new Map()

    for (const groupKey of selectedGroupKeys) {
      const minutes = bucketMap.get(groupKey) || 0
      row[groupKey] = minutes
      row.totalMinutes = Number(row.totalMinutes) + minutes
    }

    if (otherKey) {
      const otherMinutes = Array.from(bucketMap.entries())
        .filter(([groupKey]) => !selectedGroupKeys.includes(groupKey))
        .reduce((sum, [, minutes]) => sum + minutes, 0)
      row[otherKey] = otherMinutes
      row.totalMinutes = Number(row.totalMinutes) + otherMinutes
    }

    return row
  })

  return { data, stacks, totalMinutes }
}

export function buildTrendSeries({
  entries,
  granularity,
  startDate,
  endDate,
}: {
  entries: FocusTimeEntry[]
  granularity: FocusGranularity
  startDate?: string
  endDate?: string
}): { data: Array<{ bucketKey: string; bucketLabel: string; minutes: number }>; totalMinutes: number } {
  const bucketTotals = new Map<string, number>()
  let totalMinutes = 0

  for (const entry of entries) {
    const dayString = getEntryDayString(entry)
    const bucketKey = getBucketKey(dayString, granularity)
    totalMinutes += entry.duration
    bucketTotals.set(bucketKey, (bucketTotals.get(bucketKey) || 0) + entry.duration)
  }

  const buckets =
    startDate && endDate ? listBucketKeys({ granularity, startDate, endDate }) : Array.from(bucketTotals.keys()).sort()
  const data = buckets.map((bucketKey) => ({
    bucketKey,
    bucketLabel: getBucketLabel(bucketKey, granularity),
    minutes: bucketTotals.get(bucketKey) || 0,
  }))

  return { data, totalMinutes }
}

function floorToMinute(date: Date): Date {
  const d = new Date(date)
  d.setSeconds(0, 0)
  return d
}

export function distributeEntryAcrossHours(
  entry: FocusTimeEntry,
): Array<{ day: string; hour: number; minutes: number }> {
  if (!entry.startedAt) return []

  const start = floorToMinute(new Date(entry.startedAt))
  const end = addMinutes(start, entry.duration)

  const allocations: Array<{ day: string; hour: number; minutes: number }> = []

  let cursor = start
  while (cursor < end) {
    const nextHour = new Date(cursor)
    nextHour.setMinutes(0, 0, 0)
    nextHour.setHours(cursor.getHours() + 1)

    const segmentEnd = nextHour < end ? nextHour : end
    const segmentMinutes = Math.max(0, Math.round((segmentEnd.getTime() - cursor.getTime()) / 60000))

    if (segmentMinutes > 0) {
      allocations.push({
        day: format(cursor, 'yyyy-MM-dd'),
        hour: cursor.getHours(),
        minutes: segmentMinutes,
      })
    }

    cursor = segmentEnd
  }

  return allocations
}

export function buildHourlyHistogram(
  entries: FocusTimeEntry[],
  allowedDays?: string[],
): {
  data: Array<{ hour: number; label: string; minutes: number }>
  excludedMinutes: number
  excludedEntries: number
  includedEntries: number
} {
  const hourBins = new Array<number>(24).fill(0)
  const allowedDaySet = allowedDays ? new Set(allowedDays) : null
  let excludedMinutes = 0
  let excludedEntries = 0
  let includedEntries = 0

  for (const entry of entries) {
    if (!entry.startedAt) {
      excludedMinutes += entry.duration
      excludedEntries += 1
      continue
    }

    includedEntries += 1
    for (const alloc of distributeEntryAcrossHours(entry)) {
      if (allowedDaySet && !allowedDaySet.has(alloc.day)) continue
      hourBins[alloc.hour] += alloc.minutes
    }
  }

  const data = hourBins.map((minutes, hour) => ({
    hour,
    label: formatHourLabel(hour),
    minutes,
  }))

  return { data, excludedMinutes, excludedEntries, includedEntries }
}

export interface TimeGridItem {
  taskId?: string
  taskName: string
  goalId?: string
  goalTitle?: string
  goalColor?: string
  minutes: number
}

export interface TimeGridCell {
  totalMinutes: number
  items: TimeGridItem[]
}

export function buildTimeGrid(
  entries: FocusTimeEntry[],
  days: string[],
): {
  grid: Record<string, TimeGridCell[]>
  excludedMinutes: number
  excludedEntries: number
  includedEntries: number
} {
  const grid: Record<string, TimeGridCell[]> = {}
  for (const day of days) {
    // Initialize with empty cells
    grid[day] = Array.from({ length: 24 }, () => ({ totalMinutes: 0, items: [] }))
  }

  let excludedMinutes = 0
  let excludedEntries = 0
  let includedEntries = 0

  for (const entry of entries) {
    if (!entry.startedAt) {
      excludedMinutes += entry.duration
      excludedEntries += 1
      continue
    }

    includedEntries += 1
    for (const alloc of distributeEntryAcrossHours(entry)) {
      if (!grid[alloc.day]) continue
      
      const cell = grid[alloc.day][alloc.hour]
      cell.totalMinutes += alloc.minutes

      // Add or update item in this cell
      // We group by taskName + goalId to avoid duplicates if split weirdly, 
      // though typically one entry per hour per task unless multiple small entries.
      const existingItem = cell.items.find(
        (i) => i.taskName === entry.taskName && i.goalId === entry.goalId
      )

      if (existingItem) {
        existingItem.minutes += alloc.minutes
      } else {
        cell.items.push({
          taskId: entry.taskId || undefined,
          taskName: entry.taskName,
          goalId: entry.goalId || undefined,
          goalTitle: entry.goal?.title,
          goalColor: entry.goal?.color,
          minutes: alloc.minutes,
        })
      }
      
      // Keep items sorted by duration desc for easy "dominant" logic
      cell.items.sort((a, b) => b.minutes - a.minutes)
    }
  }

  return { grid, excludedMinutes, excludedEntries, includedEntries }
}

export function formatMinutesAsHoursTick(minutes: number): string {
  if (minutes === 0) return '0'
  const hours = minutes / 60
  if (Number.isInteger(hours)) return `${hours}h`
  return `${hours.toFixed(1)}h`
}

export function formatHourLabel(hour: number): string {
  const meridiem = hour >= 12 ? 'pm' : 'am'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}${meridiem}`
}

export function formatExcludedNote(excludedMinutes: number, excludedEntries: number): string {
  if (excludedMinutes <= 0) return ''
  const suffix = excludedEntries === 1 ? 'entry' : 'entries'
  return `Excluding ${formatDuration(excludedMinutes)} (${excludedEntries} ${suffix}) without a start time.`
}
