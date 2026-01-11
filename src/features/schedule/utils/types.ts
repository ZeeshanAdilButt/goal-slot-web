export interface ScheduleBlock {
  id: string
  title: string
  startTime: string
  endTime: string
  dayOfWeek: number
  category: string
  color: string
  isRecurring: boolean
  seriesId: string
  goalId?: string
  goal?: { id: string; title: string; color: string; category?: string }
  tasks?: { id: string; title: string; status: string }[]
}

export type WeekSchedule = Record<number, ScheduleBlock[]>

export type SchedulePayload = {
  title: string
  startTime: string
  endTime: string
  dayOfWeek: number
  category: string
  color: string
  goalId?: string
  seriesId?: string
}

export type ScheduleUpdateScope = 'single' | 'series'

export type ScheduleUpdatePayload = Partial<Omit<SchedulePayload, 'seriesId'>> & {
  updateScope?: ScheduleUpdateScope
}

export type DraftSelection = {
  dayOfWeek: number
  start: number
  end: number
}
