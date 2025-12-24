import { clsx, type ClassValue } from 'clsx'
import { addDays, endOfWeek, format, parseISO, startOfWeek } from 'date-fns'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

export function getWeekDates(date: Date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 }) // Monday
  const end = endOfWeek(date, { weekStartsOn: 1 })

  const days = []
  for (let i = 0; i < 7; i++) {
    days.push(addDays(start, i))
  }

  return { start, end, days }
}

export function formatDate(date: Date | string, formatStr: string = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, formatStr)
}

export function getProgressColor(progress: number): string {
  if (progress >= 75) return 'bg-accent-green'
  if (progress >= 50) return 'bg-primary'
  if (progress >= 25) return 'bg-accent-orange'
  return 'bg-accent-pink'
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const DAYS_OF_WEEK_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const COLOR_OPTIONS = [
  '#FFD700', // Yellow
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#22C55E', // Green
  '#8B5CF6', // Purple
  '#F97316', // Orange
]

export const TIME_OPTIONS = Array.from({ length: (24 * 60) / 15 }, (_, i) => {
  const totalMinutes = i * 15
  const hour = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  const minuteLabel = minutes.toString().padStart(2, '0')
  return {
    value: `${hour.toString().padStart(2, '0')}:${minuteLabel}`,
    label: `${displayHour}:${minuteLabel} ${ampm}`,
  }
})
