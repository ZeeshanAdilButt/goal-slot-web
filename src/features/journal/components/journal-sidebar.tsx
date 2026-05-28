'use client'

import { useMemo, useState } from 'react'

import { JournalEntry } from '@/features/journal/hooks/use-journal-entries'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { DayPicker, type DateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'

interface JournalSidebarProps {
  entries: JournalEntry[]
  selectedDate: string | null
  onSelect: (date: string) => void
}

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatChip(date: string, today: string): string {
  if (date === today) return 'Today'
  const d = new Date(`${date}T00:00:00`)
  if (Number.isNaN(d.getTime())) return date
  const diffDays = Math.floor(
    (new Date(`${today}T00:00:00`).getTime() - d.getTime()) / 86_400_000,
  )
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: 'long' })
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function JournalSidebar({ entries, selectedDate, onSelect }: JournalSidebarProps) {
  const today = todayKey()
  const todayObj = useMemo(() => new Date(), [])
  // The month currently shown in the calendar.
  const [viewMonth, setViewMonth] = useState<Date>(() =>
    selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date(),
  )
  // Optional date range to filter the entries list. When set, the list
  // below the calendar shows only entries whose date falls within
  // [range.from, range.to]. Click two days on the calendar to define;
  // click Clear to reset.
  const [range, setRange] = useState<DateRange | undefined>(undefined)

  const entryDates = useMemo(
    () => entries.map((e) => new Date(`${e.date}T00:00:00`)),
    [entries],
  )

  // Highlight the current week (Sun-Sat) on the calendar so the user
  // sees their journaling window at a glance.
  const thisWeekDates = useMemo(() => {
    const dow = todayObj.getDay()
    const start = new Date(todayObj)
    start.setDate(todayObj.getDate() - dow)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [todayObj])

  // Entries filtered by the active range (if any), with Today pinned at top
  // when no entry exists for it and no range is active.
  const list = useMemo(() => {
    const fromKey = range?.from ? toDateKey(range.from) : null
    const toKey = range?.to ? toDateKey(range.to) : fromKey
    const within = (date: string): boolean => {
      if (!fromKey) return true
      if (!toKey) return date === fromKey
      return date >= fromKey && date <= toKey
    }
    const dates = new Set(entries.map((e) => e.date))
    const ordered: { date: string; entry: JournalEntry | null }[] = []
    if (!range && !dates.has(today)) ordered.push({ date: today, entry: null })
    entries
      .slice()
      .filter((e) => within(e.date))
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .forEach((e) => ordered.push({ date: e.date, entry: e }))
    return ordered
  }, [entries, today, range])

  const handleRangeChange = (next: DateRange | undefined) => {
    setRange(next)
    // When the user has picked a full range with a single entry inside,
    // auto-open that entry so the editor follows the filter.
    if (next?.from && next.to) {
      const fromKey = toDateKey(next.from)
      const toKey = toDateKey(next.to)
      const hits = entries
        .filter((e) => e.date >= fromKey && e.date <= toKey)
        .sort((a, b) => (a.date < b.date ? 1 : -1))
      if (hits.length > 0) onSelect(hits[0].date)
    } else if (next?.from && !next.to) {
      onSelect(toDateKey(next.from))
    }
  }

  // Quick presets the user can click to set a common date range on the
  // calendar without having to click two days. Each computes [from, to]
  // for week (Sun-today), month-to-date, quarter-to-date, year-to-date.
  // Short labels so the 4 chips fit comfortably in the narrow sidebar
  // even at 240px wide. Full names live in `title` for hover discoverability.
  const presets: {
    key: string
    label: string
    full: string
    build: () => DateRange
  }[] = [
    {
      key: 'week',
      label: 'Wk',
      full: 'This week',
      build: () => {
        const from = new Date(todayObj)
        from.setDate(todayObj.getDate() - todayObj.getDay())
        return { from, to: todayObj }
      },
    },
    {
      key: 'month',
      label: 'Mo',
      full: 'This month',
      build: () => ({
        from: new Date(todayObj.getFullYear(), todayObj.getMonth(), 1),
        to: todayObj,
      }),
    },
    {
      key: 'quarter',
      label: 'Qtr',
      full: 'This quarter',
      build: () => {
        const startMonth = Math.floor(todayObj.getMonth() / 3) * 3
        return {
          from: new Date(todayObj.getFullYear(), startMonth, 1),
          to: todayObj,
        }
      },
    },
    {
      key: 'year',
      label: 'Yr',
      full: 'This year',
      build: () => ({
        from: new Date(todayObj.getFullYear(), 0, 1),
        to: todayObj,
      }),
    },
  ]

  // Which preset (if any) currently matches the active range — for the
  // "selected" visual on the chip row.
  const activePresetKey = useMemo(() => {
    if (!range?.from || !range.to) return null
    const fromKey = toDateKey(range.from)
    const toKey = toDateKey(range.to)
    for (const p of presets) {
      const r = p.build()
      if (r.from && r.to && toDateKey(r.from) === fromKey && toDateKey(r.to) === toKey) {
        return p.key
      }
    }
    return null
    // presets is rebuilt every render but deps don't change meaningfully here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range])

  const selectedDateObj = selectedDate ? new Date(`${selectedDate}T00:00:00`) : undefined

  const shiftMonth = (delta: number) => {
    setViewMonth((prev) => {
      const next = new Date(prev)
      next.setMonth(prev.getMonth() + delta)
      return next
    })
  }

  const monthLabel = viewMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-3">
      {/* Inline calendar pinned to the top with explicit month nav. */}
      <div className="rounded-lg border border-zinc-200 bg-white p-2">
        {/* Compact segmented preset row — short labels (Wk / Mo / Qtr / Yr)
            so the four chips fit cleanly in a narrow sidebar without
            overflowing. Full names available on hover via title. */}
        <div className="mb-2 grid grid-cols-4 gap-0.5 rounded-lg border border-zinc-200 bg-zinc-100 p-0.5">
          {presets.map((p) => {
            const isActive = activePresetKey === p.key
            return (
              <button
                key={p.key}
                type="button"
                title={p.full}
                onClick={() => handleRangeChange(p.build())}
                className={cn(
                  'rounded-md px-1 py-1 text-[10px] font-bold uppercase tracking-wider transition-all',
                  isActive
                    ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-900',
                )}
              >
                {p.label}
              </button>
            )
          })}
        </div>
        <div className="mb-1 flex items-center justify-between gap-2 px-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            className="inline-flex h-6 w-6 items-center justify-center rounded text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-700">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
            className="inline-flex h-6 w-6 items-center justify-center rounded text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <DayPicker
          mode="range"
          month={viewMonth}
          onMonthChange={setViewMonth}
          selected={range}
          onSelect={handleRangeChange}
          disabled={{ after: new Date() }}
          modifiers={{ hasEntry: entryDates, thisWeek: thisWeekDates }}
          modifiersClassNames={{
            hasEntry:
              'relative after:absolute after:bottom-0.5 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-[#f2cc0d]',
            thisWeek: 'bg-[#fffbea]',
          }}
          showOutsideDays={false}
          classNames={{
            root: 'text-xs',
            months: 'flex flex-col',
            month: 'space-y-0',
            month_caption: 'hidden',
            nav: 'hidden',
            month_grid: 'w-full border-collapse',
            weekdays: 'flex',
            weekday:
              'flex-1 text-center text-[9px] font-semibold uppercase tracking-wider text-zinc-400 py-0.5',
            weeks: 'flex flex-col',
            week: 'flex w-full',
            day: 'flex-1 p-0 text-center',
            day_button:
              'h-7 w-full rounded text-[11px] font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40',
            today: 'font-bold text-[#8a7307]',
            range_start: '[&_button]:!bg-[#f2cc0d] [&_button]:!text-zinc-900 rounded-l',
            range_end: '[&_button]:!bg-[#f2cc0d] [&_button]:!text-zinc-900 rounded-r',
            range_middle: 'bg-[#f2cc0d]/20',
          }}
        />
        {range?.from && (
          <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-zinc-100 px-1 pt-1.5">
            <span className="text-[10px] text-zinc-500">
              {range.to
                ? `${range.from.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${range.to.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                : `From ${range.from.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
            </span>
            <button
              type="button"
              onClick={() => setRange(undefined)}
              className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
        Recent entries
      </div>

      <ul className="flex flex-col gap-0.5">
        {list.map(({ date, entry }) => {
          const isSelected = date === selectedDate
          const isToday = date === today
          return (
            <li key={date}>
              <button
                type="button"
                onClick={() => onSelect(date)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
                  isSelected
                    ? 'bg-[#fff7d1] text-zinc-900 ring-1 ring-[#f2cc0d]/40'
                    : 'text-zinc-700 hover:bg-zinc-50',
                )}
              >
                <span className="flex items-center gap-2 truncate">
                  {isToday && (
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#f2cc0d]" aria-hidden />
                  )}
                  <span className="truncate font-medium">{formatChip(date, today)}</span>
                </span>
                {entry && (entry.mood !== null || entry.energy !== null) && (
                  <span className="shrink-0 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
                    M{entry.mood ?? '-'} · E{entry.energy ?? '-'}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
