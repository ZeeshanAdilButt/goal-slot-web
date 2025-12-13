import { DAY_END_MIN, DAY_START_MIN, SLOT_MIN } from '@/features/schedule/utils/constants'
import { WeekSchedule } from '@/features/schedule/utils/types'

import { timeToMinutes } from '@/lib/utils'

export const snapMinutes = (minutes: number) => {
  const clamped = Math.max(DAY_START_MIN, Math.min(DAY_END_MIN, minutes))
  return Math.round(clamped / SLOT_MIN) * SLOT_MIN
}

export const hasOverlap = (weekSchedule: WeekSchedule, day: number, start: number, end: number, ignoreId?: string) => {
  return (weekSchedule[day] || []).some((block) => {
    if (block.id === ignoreId) return false
    const bStart = timeToMinutes(block.startTime)
    const bEnd = timeToMinutes(block.endTime)
    return start < bEnd && end > bStart
  })
}
