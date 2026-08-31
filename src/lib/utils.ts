import { clsx, type ClassValue } from 'clsx'
import { format, parseISO } from 'date-fns'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) return '0m'

  const normalizedMinutes = Math.floor(minutes)
  const hours = Math.floor(normalizedMinutes / 60)
  const mins = normalizedMinutes % 60

  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

export function formatDate(date: Date | string, formatStr: string = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, formatStr)
}

/**
 * Get the current date as a YYYY-MM-DD string in local timezone.
 * This is important because toISOString() uses UTC which can show the wrong date
 * in timezones behind UTC.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Return local time in HH:mm so we can align schedule detection to the user's clock
export function getLocalTimeString(date: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
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

/**
 * Convert "HH:mm" (24h) into "h:mm AM/PM". Used in user-facing surfaces;
 * keep storage and APIs in HH:mm.
 */
export function formatTime12h(time: string): string {
  const [hStr, mStr] = time.split(':')
  const h = Number(hStr)
  const m = Number(mStr)
  if (Number.isNaN(h) || Number.isNaN(m)) return time
  const ampm = h >= 12 ? 'PM' : 'AM'
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${displayHour}:${m.toString().padStart(2, '0')} ${ampm}`
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
  '#EF4444', // Red
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#F59E0B', // Amber
  '#64748B', // Slate
  '#A855F7', // Fuchsia
  '#10B981', // Emerald
  '#F43F5E', // Rose
  '#0EA5E9', // Sky
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

/**
 * TIME_OPTIONS with `values` folded in, so a `<Select>` always has an item
 * matching whatever it is currently showing.
 *
 * TIME_OPTIONS is a fixed 15-minute grid, but stored times are not: the Coach
 * proposes real-world times, and production carries blocks at 04:20, 09:25,
 * 13:05 and 23:59. A Select whose value matches no item renders its
 * placeholder, so those blocks opened with the time fields looking blank and
 * no way to see, let alone re-pick, the time already set. That reads as
 * "cannot edit the time".
 *
 * Off-grid values are inserted in chronological order rather than appended,
 * so the dropdown stays scannable.
 */
export function timeOptionsIncluding(...values: (string | null | undefined)[]): { value: string; label: string }[] {
  const extras = values.filter(
    (v): v is string => typeof v === 'string' && /^\d{2}:\d{2}$/.test(v) && !TIME_OPTIONS.some((o) => o.value === v),
  )
  if (extras.length === 0) return TIME_OPTIONS

  const toMinutes = (v: string) => {
    const [h, m] = v.split(':')
    return Number(h) * 60 + Number(m)
  }
  const labelFor = (v: string) => {
    const [h, m] = v.split(':')
    const hour = Number(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${m} ${ampm}`
  }

  const merged = [...TIME_OPTIONS]
  for (const value of Array.from(new Set(extras))) {
    if (merged.some((o) => o.value === value)) continue
    merged.push({ value, label: labelFor(value) })
  }
  return merged.sort((a, b) => toMinutes(a.value) - toMinutes(b.value))
}

export const toISOString = (date: Date | string): string => {
  const d = new Date(date)
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}
