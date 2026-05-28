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

/**
 * Find the next upcoming schedule block after `date`. Looks at the rest of
 * today first, then walks forward up to 7 days. Returns the block plus the
 * absolute Date its start represents so callers can format "in 25 min" or
 * "Tomorrow, 9 AM" without re-deriving day math.
 */
export function findNextScheduleBlock(
  weekSchedule: WeekSchedule | undefined,
  date: Date,
): { block: ScheduleBlock; startsAt: Date } | null {
  if (!weekSchedule) return null
  const minutes = date.getHours() * 60 + date.getMinutes()

  for (let offset = 0; offset < 7; offset++) {
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
      return { block, startsAt }
    }
  }
  return null
}
