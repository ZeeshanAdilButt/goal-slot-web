import type { ScheduleBlock, WeekSchedule } from '@/features/schedule/utils/types'

import { DAYS_OF_WEEK, formatTime12h } from '@/lib/utils'

import { hhmmToMinutes } from './time-input'

export type BlockConflict = { day: number; block: ScheduleBlock }

/**
 * Blocks in the already-loaded week that overlap start..end on any of `days`.
 * Touching edges do not overlap (7:00-7:30 and 7:30-8:00 are fine).
 * `excludeIds` are skipped: the block being edited and, for an all-blocks
 * save, its whole series. Returns [] for an unreadable or empty time range.
 * This is a preview only; the server stays the authority.
 */
export function findConflicts(
  weekSchedule: WeekSchedule,
  days: number[],
  startTime: string,
  endTime: string,
  excludeIds: ReadonlySet<string> = new Set(),
): BlockConflict[] {
  const start = hhmmToMinutes(startTime)
  const end = hhmmToMinutes(endTime)
  if (start === null || end === null || end <= start) return []

  const result: BlockConflict[] = []
  for (const day of Array.from(new Set(days)).sort((a, b) => a - b)) {
    for (const block of weekSchedule?.[day] ?? []) {
      if (excludeIds.has(block.id)) continue
      const bStart = hhmmToMinutes(block.startTime)
      const bEnd = hhmmToMinutes(block.endTime)
      if (bStart === null || bEnd === null) continue
      if (start < bEnd && end > bStart) result.push({ day, block })
    }
  }
  return result
}

/** "Sat 7:00 AM to 7:30 AM overlaps Soft Skills Lab" */
export function describeConflict(conflict: BlockConflict, startTime: string, endTime: string): string {
  return `${DAYS_OF_WEEK[conflict.day]} ${formatTime12h(startTime)} to ${formatTime12h(endTime)} overlaps ${conflict.block.title}`
}
