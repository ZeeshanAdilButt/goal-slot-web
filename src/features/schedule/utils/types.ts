export interface ScheduleBlock {
  id: string
  title: string
  startTime: string
  endTime: string
  dayOfWeek: number
  category: string
  color: string
  isRecurring: boolean
  isPrivate: boolean
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
  isPrivate?: boolean
}

export type ScheduleUpdateScope = 'single' | 'series'

export type ScheduleUpdatePayload = Partial<Omit<SchedulePayload, 'seriesId'>> & {
  updateScope?: ScheduleUpdateScope
}

// Response of POST /schedule/:id/days.
export type ScheduleSetDaysResult = {
  blocks: ScheduleBlock[]
  added: number[]
  removed: number[]
}

export type DraftSelection = {
  dayOfWeek: number
  start: number
  end: number
}

// View-density preference for the weekly schedule grid — how much
// horizontal room each day column gets, and whether block titles wrap.
// Orthogonal to DraggableBlock's height-based isTiny/isCompact (which is
// about a block's own vertical space, not the grid's column width).
export type ScheduleDensity = 'compact' | 'comfortable'
