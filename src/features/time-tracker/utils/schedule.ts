import { WeekSchedule, ScheduleBlock } from '@/features/schedule/utils/types'
import { timeToMinutes } from '@/lib/utils'

export function buildLocalDateFromParts(dateString: string, timeString?: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  const [hours = 0, minutes = 0] = (timeString || '00:00').split(':').map(Number)
  return new Date(year, (month || 1) - 1, day || 1, hours, minutes, 0, 0)
}

export function findScheduleBlockForDateTime(
  weekSchedule: WeekSchedule | undefined,
  date: Date,
): ScheduleBlock | null {
  if (!weekSchedule) return null
  const day = date.getDay()
  const blocks = weekSchedule[day] || []
  const minutes = date.getHours() * 60 + date.getMinutes()

  return (
    blocks.find((block) => {
      const start = timeToMinutes(block.startTime)
      const end = timeToMinutes(block.endTime)
      return minutes >= start && minutes < end
    }) || null
  )
}

export interface UpcomingScheduleBlock {
  block: ScheduleBlock
  startsAt: Date
}

/**
 * Walk forward from `date` and collect the next `count` upcoming blocks
 * across up to 7 days. Used by the FocusNowBar to show a small queue of
 * what's coming up — current behaviour returns just the immediate next
 * via findNextScheduleBlock (kept as a thin wrapper for callers that
 * only want one).
 */
export function findUpcomingScheduleBlocks(
  weekSchedule: WeekSchedule | undefined,
  date: Date,
  count: number,
): UpcomingScheduleBlock[] {
  if (!weekSchedule || count <= 0) return []
  const minutes = date.getHours() * 60 + date.getMinutes()
  const out: UpcomingScheduleBlock[] = []

  for (let offset = 0; offset < 7 && out.length < count; offset++) {
    const day = (date.getDay() + offset) % 7
    const blocks = (weekSchedule[day] || []).slice().sort((a, b) => {
      return timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    })
    for (const block of blocks) {
      const blockStart = timeToMinutes(block.startTime)
      if (offset === 0 && blockStart <= minutes) continue
      const startsAt = new Date(date)
      startsAt.setDate(startsAt.getDate() + offset)
      const [h, m] = block.startTime.split(':').map(Number)
      startsAt.setHours(h, m, 0, 0)
      out.push({ block, startsAt })
      if (out.length >= count) break
    }
  }
  return out
}

export function findNextScheduleBlock(
  weekSchedule: WeekSchedule | undefined,
  date: Date,
): UpcomingScheduleBlock | null {
  return findUpcomingScheduleBlocks(weekSchedule, date, 1)[0] ?? null
}
