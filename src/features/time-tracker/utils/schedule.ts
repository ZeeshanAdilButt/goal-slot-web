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
