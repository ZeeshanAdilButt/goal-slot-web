'use client'

import { useState } from 'react'

import { JournalEntry } from '@/features/journal/hooks/use-journal-entries'
import { Calendar, Plus } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { GlassCard } from '@/components/ui/glass-card'
import { SectionHeader } from '@/components/ui/section-header'

interface JournalSidebarProps {
  entries: JournalEntry[]
  selectedDate: string | null
  onSelect: (date: string) => void
}

function formatDate(date: string): string {
  // YYYY-MM-DD -> "Mon, Jan 5"
  const d = new Date(`${date}T00:00:00`)
  if (Number.isNaN(d.getTime())) return date
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function JournalSidebar({ entries, selectedDate, onSelect }: JournalSidebarProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerValue, setPickerValue] = useState(todayKey())

  const handleAdd = () => {
    if (!pickerValue) return
    onSelect(pickerValue)
    setPickerOpen(false)
  }

  return (
    <GlassCard padded={false} className="p-4 space-y-3">
      <SectionHeader
        title="Past entries"
        action={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setPickerOpen((o) => !o)}
            aria-expanded={pickerOpen}
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </Button>
        }
      />

      {pickerOpen && (
        <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-2.5">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Entry date
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={pickerValue}
              max={todayKey()}
              onChange={(e) => setPickerValue(e.target.value)}
              className="h-9 flex-1 rounded-md border border-zinc-200 bg-white px-2 text-sm text-zinc-900 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d]"
            />
            <Button type="button" variant="brand" size="sm" onClick={handleAdd} disabled={!pickerValue}>
              Open
            </Button>
          </div>
          <p className="text-[11px] text-zinc-500">
            One entry per day. Picking a date you&apos;ve already used will open that entry.
          </p>
        </div>
      )}

      {entries.length === 0 ? (
        <EmptyState
          icon={<Calendar />}
          title="No entries yet"
          description="Start writing — your first entry appears here."
        />
      ) : (
        <div className="flex flex-col gap-1">
          {entries.map((entry) => {
            const isSelected = entry.date === selectedDate
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => onSelect(entry.date)}
                className={cn(
                  'flex items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
                  isSelected ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-700 hover:bg-zinc-50',
                )}
              >
                <span className="font-medium">{formatDate(entry.date)}</span>
                {(entry.mood !== null || entry.energy !== null) && (
                  <Badge variant="default" className="text-[10px]">
                    M{entry.mood ?? '–'} E{entry.energy ?? '–'}
                  </Badge>
                )}
              </button>
            )
          })}
        </div>
      )}
    </GlassCard>
  )
}
