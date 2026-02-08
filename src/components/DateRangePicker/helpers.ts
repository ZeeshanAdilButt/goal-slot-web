import type { DateRangeValue } from './types'

export interface InternalRange {
  from?: Date
  to?: Date
}

export interface Preset {
  name: string
  label: string
}

export const PRESETS: Preset[] = [
  { name: 'last7', label: 'Last week' },
  { name: 'last30', label: 'Last month' },
  { name: 'last3Months', label: 'Last 3 months' },
  { name: 'last6Months', label: 'Last 6 months' },
  { name: 'last365', label: 'Last year' },
]

const pad = (value: number) => value.toString().padStart(2, '0')

export const toDateString = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export const normalizeDate = (date: Date) => {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

export const parseDateValue = (value?: string) => {
  if (!value) return undefined
  const [year, month, day] = value.split('-').map((part) => Number(part))
  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return undefined
  }
  const d = new Date(year, month - 1, day)
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return undefined
  }
  return normalizeDate(d)
}

export const formatDisplayDate = (date: Date, locale: string) =>
  date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

export const createRangeFromValue = (value?: DateRangeValue): InternalRange => {
  const from = parseDateValue(value?.from)
  const to = parseDateValue(value?.to)

  if (!from && !to) {
    return { from: undefined, to: undefined }
  }

  if (!from && to) {
    return { from: to, to }
  }

  if (from && to && to < from) {
    return { from: to, to: from }
  }

  return { from: from ?? undefined, to: to ?? undefined }
}

export const createValueFromRange = (range?: InternalRange): DateRangeValue | undefined => {
  if (!range?.from) return undefined
  return {
    from: toDateString(range.from),
    to: range.to ? toDateString(range.to) : undefined,
  }
}

export const getPresetRange = (name: string): InternalRange => {
  const today = normalizeDate(new Date())
  const start = normalizeDate(new Date(today))
  const end = normalizeDate(new Date(today))

  switch (name) {
    case 'last7':
      start.setDate(start.getDate() - 6)
      break
    case 'last30':
      start.setDate(start.getDate() - 29)
      break
    case 'last3Months':
      start.setMonth(start.getMonth() - 3)
      break
    case 'last6Months':
      start.setMonth(start.getMonth() - 6)
      break
    case 'last365':
      start.setDate(start.getDate() - 364)
      break
    default:
      break
  }

  return { from: start, to: end }
}

export const rangesAreEqual = (a?: InternalRange, b?: InternalRange) => {
  const hasA = Boolean(a?.from || a?.to)
  const hasB = Boolean(b?.from || b?.to)

  if (!hasA && !hasB) return true
  if (!a?.from || !b?.from) return false

  const toA = a.to ?? a.from
  const toB = b.to ?? b.from
  return a.from.getTime() === b.from.getTime() && toA.getTime() === toB.getTime()
}

export const createCompareRangeFromPrimary = (range: InternalRange): InternalRange | undefined => {
  if (!range.from) return undefined
  const compareFrom = new Date(range.from.getFullYear() - 1, range.from.getMonth(), range.from.getDate())
  const compareTo = range.to ? new Date(range.to.getFullYear() - 1, range.to.getMonth(), range.to.getDate()) : undefined
  return {
    from: normalizeDate(compareFrom),
    to: compareTo ? normalizeDate(compareTo) : undefined,
  }
}
