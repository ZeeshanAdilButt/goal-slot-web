// Pure helpers for the typed start/end time fields in the block dialog.
// Times are stored and sent as 24-hour "HH:mm" strings; the API rejects a
// block that crosses midnight, so the latest usable time is 23:59.

export const MAX_MINUTE_OF_DAY = 23 * 60 + 59

export const DURATION_CHIPS: { minutes: number; label: string }[] = [
  { minutes: 15, label: '15m' },
  { minutes: 30, label: '30m' },
  { minutes: 45, label: '45m' },
  { minutes: 60, label: '1h' },
  { minutes: 90, label: '1.5h' },
  { minutes: 120, label: '2h' },
  { minutes: 180, label: '3h' },
]

const pad = (n: number) => n.toString().padStart(2, '0')

/** "HH:mm" -> minutes since midnight, or null when it is not a valid time. */
export function hhmmToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time)
  if (!match) return null
  const h = Number(match[1])
  const m = Number(match[2])
  if (h > 23 || m > 59) return null
  return h * 60 + m
}

export function minutesToHhmm(minutes: number): string {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`
}

/**
 * Parse what a person types into a time field and return "HH:mm", or null
 * when it cannot be read as a time of day.
 *
 * Accepted: "7", "7a", "7p", "7am", "7:30", "7:30pm", "7 pm", "730", "1930",
 * "19:30", "12am" (midnight), "12pm" (noon). A bare number or HH:mm is read
 * as a 24-hour time ("7" is 07:00); an a/p/am/pm suffix makes it 12-hour, so
 * the hour must then be 1 to 12.
 */
export function parseTimeInput(raw: string): string | null {
  const text = raw.trim().toLowerCase()
  if (!text) return null

  const match = /^(\d{1,4})(?:[:.](\d{2}))?\s*(a|p|am|pm|a\.m\.|p\.m\.)?$/.exec(text)
  if (!match) return null

  const [, head, explicitMinutes, suffix] = match
  let hours: number
  let minutes: number

  if (explicitMinutes !== undefined) {
    // "7:30" form: the part before the separator is the hour on its own.
    if (head.length > 2) return null
    hours = Number(head)
    minutes = Number(explicitMinutes)
  } else if (head.length <= 2) {
    hours = Number(head)
    minutes = 0
  } else {
    // "730" / "1930": the last two digits are the minutes.
    hours = Number(head.slice(0, -2))
    minutes = Number(head.slice(-2))
  }

  if (minutes > 59) return null

  if (suffix) {
    if (hours < 1 || hours > 12) return null
    const isPm = suffix.startsWith('p')
    hours = hours % 12 + (isPm ? 12 : 0)
  } else if (hours > 23) {
    return null
  }

  return `${pad(hours)}:${pad(minutes)}`
}

/** Minutes between two "HH:mm" times (end minus start), or null if either is invalid. */
export function durationMinutes(start: string, end: string): number | null {
  const s = hhmmToMinutes(start)
  const e = hhmmToMinutes(end)
  if (s === null || e === null) return null
  return e - s
}

/** "1h 30m", "45m", "2h". Zero or negative durations read as "0m". */
export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes))
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/** True when end is strictly after start on the same day. */
export function isEndAfterStart(start: string, end: string): boolean {
  const d = durationMinutes(start, end)
  return d !== null && d > 0
}

/**
 * start + minutes as "HH:mm", or null when that would run past 23:59 (a block
 * cannot cross midnight).
 */
export function addMinutesToTime(start: string, minutes: number): string | null {
  const s = hhmmToMinutes(start)
  if (s === null) return null
  const total = s + minutes
  if (total > MAX_MINUTE_OF_DAY) return null
  return minutesToHhmm(total)
}

/**
 * New end time when the start moves from oldStart to newStart and the block
 * keeps its length. If keeping the length would run past 23:59 the end is
 * pinned to 23:59, so the user sees the clamp instead of a silent wrap.
 * Returns null when any input is not a valid time.
 */
export function shiftEndWithStart(oldStart: string, oldEnd: string, newStart: string): string | null {
  const length = durationMinutes(oldStart, oldEnd)
  const ns = hhmmToMinutes(newStart)
  if (length === null || ns === null) return null
  // An already-invalid range (end before start) has no length worth keeping.
  const keep = length > 0 ? length : 60
  return minutesToHhmm(Math.min(ns + keep, MAX_MINUTE_OF_DAY))
}
