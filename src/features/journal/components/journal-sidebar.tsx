'use client'

import { useMemo, useState } from 'react'

import { JournalEntry } from '@/features/journal/hooks/use-journal-entries'
import { Calendar, ChevronDown } from 'lucide-react'

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
  const [showPicker, setShowPicker] = useState(false)
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
    setShowPicker(false)
  }

  return (
    <div className="space-y-2">
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
                    M{entry.mood ?? '–'} · E{entry.energy ?? '–'}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      <div className="border-t border-zinc-100 pt-2">
        <button
          type="button"
          onClick={() => setShowPicker((s) => !s)}
          className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-700"
          aria-expanded={showPicker}
        >
          <span className="inline-flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            Jump to a date
          </span>
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showPicker && 'rotate-180')} />
        </button>

        {showPicker && (
          <div className="mt-1.5 flex items-center gap-2 px-1">
            <input
              type="date"
              value={pickerValue}
              max={today}
              onChange={(e) => setPickerValue(e.target.value)}
              className="h-8 flex-1 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-900 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d]"
            />
            <button
              type="button"
              onClick={handlePick}
              disabled={!pickerValue}
              className="h-8 rounded-md bg-[#f2cc0d] px-2.5 text-xs font-semibold text-zinc-900 transition-colors hover:bg-[#dfb90c] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Open
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
