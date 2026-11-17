import type { ScheduleBlock, WeekSchedule } from '@/features/schedule/utils/types'

import { DAYS_OF_WEEK } from '@/lib/utils'

export type DayDiff = { added: number[]; removed: number[] }

const sortedUnique = (days: number[]) => Array.from(new Set(days)).sort((a, b) => a - b)

/** "Mon, Tue, Wed" from day indexes (0 = Sunday), in week order. */
export function formatDayList(days: number[]): string {
  return sortedUnique(days)
    .map((d) => DAYS_OF_WEEK[d])
    .filter(Boolean)
    .join(', ')
}

/** Which days a save would add and remove to turn `current` into `next`. */
export function diffDays(current: number[], next: number[]): DayDiff {
  const cur = new Set(current)
  const nxt = new Set(next)
  return {
    added: sortedUnique(next.filter((d) => !cur.has(d))),
    removed: sortedUnique(current.filter((d) => !nxt.has(d))),
  }
}

/** "Adds Wed, Thu. Removes Fri." Empty string when nothing changes. */
export function summarizeDayDiff({ added, removed }: DayDiff): string {
  const parts: string[] = []
  if (added.length > 0) parts.push(`Adds ${formatDayList(added)}.`)
  if (removed.length > 0) parts.push(`Removes ${formatDayList(removed)}.`)
  return parts.join(' ')
}

/**
 * Every block in the same series as `block`, including `block` itself. A block
 * with no seriesId stands alone. Always returns at least the block itself,
 * even if the cached week does not contain it (for example a block that was
 * just created optimistically).
 */
export function getSeriesBlocks(weekSchedule: WeekSchedule, block: ScheduleBlock): ScheduleBlock[] {
  if (!block.seriesId) return [block]
  const siblings = Object.values(weekSchedule || {})
    .flat()
    .filter((b) => b.seriesId === block.seriesId)
  return siblings.some((b) => b.id === block.id) ? siblings : [block, ...siblings]
}

/** The days a series covers, in week order. */
export function seriesDays(blocks: ScheduleBlock[]): number[] {
  return sortedUnique(blocks.map((b) => b.dayOfWeek))
}

/**
 * Replace one day in a day set (used when a block moves from `from` to `to`).
 * If `to` is already in the set the two collapse into one.
 */
export function replaceDay(days: number[], from: number, to: number): number[] {
  return sortedUnique(days.map((d) => (d === from ? to : d)))
}
