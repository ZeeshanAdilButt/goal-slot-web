'use client'

import { useMemo } from 'react'

import { JournalEntry } from '@/features/journal/hooks/use-journal-entries'
import { DayPicker } from 'react-day-picker'

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

export function JournalSidebar({ entries, selectedDate, onSelect }: JournalSidebarProps) {
  const today = todayKey()

  // Ensure "Today" appears first as a tappable chip even when no entry exists yet.
  const list = useMemo(() => {
    const dates = new Set(entries.map((e) => e.date))
    const ordered: { date: string; entry: JournalEntry | null }[] = []
    if (!dates.has(today)) ordered.push({ date: today, entry: null })
    entries
      .slice()
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .forEach((e) => ordered.push({ date: e.date, entry: e }))
    return ordered
  }, [entries, today])

  const entryDates = useMemo(
    () => entries.map((e) => new Date(`${e.date}T00:00:00`)),
    [entries],
  )

  const selectedDateObj = selectedDate ? new Date(`${selectedDate}T00:00:00`) : undefined

  const handlePickDay = (day: Date | undefined) => {
    if (!day) return
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
    onSelect(key)
  }

  return (
    <div className="space-y-3">
      {/* Inline calendar pinned to the top — click any day to jump to it. */}
      <div className="rounded-lg border border-zinc-200 bg-white p-2">
        <DayPicker
          mode="single"
          selected={selectedDateObj}
          onSelect={handlePickDay}
          disabled={{ after: new Date() }}
          modifiers={{ hasEntry: entryDates }}
          modifiersClassNames={{
            hasEntry: 'after:absolute after:bottom-0.5 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-[#f2cc0d] relative',
          }}
          showOutsideDays={false}
          classNames={{
            root: 'text-xs',
            months: 'flex flex-col',
            month: 'space-y-1',
            month_caption: 'flex justify-center font-semibold text-[11px] uppercase tracking-wider text-zinc-600',
            nav: 'flex items-center justify-between absolute right-1 top-1 z-10',
            button_previous: 'h-6 w-6 rounded hover:bg-zinc-100 inline-flex items-center justify-center text-zinc-500',
            button_next: 'h-6 w-6 rounded hover:bg-zinc-100 inline-flex items-center justify-center text-zinc-500',
            month_grid: 'w-full border-collapse mt-1',
            weekdays: 'flex',
            weekday: 'flex-1 text-center text-[9px] font-semibold uppercase tracking-wider text-zinc-400 py-0.5',
            weeks: 'flex flex-col',
            week: 'flex w-full',
            day: 'flex-1 p-0 text-center',
            day_button: 'h-6 w-full rounded text-[11px] font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40',
            today: 'font-bold text-[#8a7307]',
            selected: '[&_button]:!bg-[#f2cc0d] [&_button]:!text-zinc-900',
          }}
        />
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
