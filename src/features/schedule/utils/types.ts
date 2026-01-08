export interface ScheduleBlock {
  id: string
  title: string
  startTime: string
  endTime: string
  dayOfWeek: number
  category: string
  color: string
  isRecurring: boolean
  goalId?: string
  goal?: { id: string; title: string; color: string; category?: string }
  tasks?: { id: string; title: string; status: string }[]
}

export interface Goal {
  id: string
  title: string
  color: string
  category?: string
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
}

export type DraftSelection = {
  dayOfWeek: number
  start: number
  end: number
}
