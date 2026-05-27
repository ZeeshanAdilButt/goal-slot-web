'use client'

import { JournalEntry } from '@/features/journal/hooks/use-journal-entries'
import { Calendar } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
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

export function JournalSidebar({ entries, selectedDate, onSelect }: JournalSidebarProps) {
  return (
    <GlassCard padded={false} className="p-4 space-y-2">
      <SectionHeader title="Past entries" />
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
