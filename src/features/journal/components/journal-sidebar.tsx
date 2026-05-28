'use client'

import { useMemo, useState } from 'react'

import { JournalEntry } from '@/features/journal/hooks/use-journal-entries'
import { Calendar } from 'lucide-react'

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
  const [pickerValue, setPickerValue] = useState(today)

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

  const handlePick = () => {
    if (!pickerValue) return
    onSelect(pickerValue)
  }

  return (
    <div className="space-y-3">
      {/* Compact inline date jump, always visible above the entries list. */}
      <div className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-1.5 py-1">
        <Calendar className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
        <input
          type="date"
          value={pickerValue}
          max={today}
          onChange={(e) => {
            setPickerValue(e.target.value)
            if (e.target.value) onSelect(e.target.value)
          }}
          aria-label="Jump to a date"
          className="h-7 min-w-0 flex-1 border-0 bg-transparent p-0 text-xs text-zinc-900 focus:outline-none focus:ring-0"
        />
        <button
          type="button"
          onClick={handlePick}
          disabled={!pickerValue}
          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8a7307] hover:bg-[#fff7d1] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Go
        </button>
      </div>

      <div className="px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
        Entries
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
