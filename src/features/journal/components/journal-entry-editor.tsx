'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { JournalEntry } from '@/features/journal/hooks/use-journal-entries'

import { GlassCard } from '@/components/ui/glass-card'
import { TiptapEditor } from '@/components/tiptap-editor/tiptap-editor'

interface JournalEntryEditorProps {
  entry: JournalEntry | null
  onSaveContent: (date: string, content: string) => void
}

function formatRelative(savedAt: number | null, now: number): string {
  if (!savedAt) return ''
  const diffMs = Math.max(0, now - savedAt)
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 5) return 'Saved · just now'
  if (diffSec < 60) return `Saved · ${diffSec} sec ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `Saved · ${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `Saved · ${diffHr} hr ago`
  const diffDay = Math.floor(diffHr / 24)
  return `Saved · ${diffDay} day${diffDay === 1 ? '' : 's'} ago`
}

function prettyDate(date: string): string {
  const d = new Date(`${date}T00:00:00`)
  if (Number.isNaN(d.getTime())) return date
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function JournalEntryEditor({ entry, onSaveContent }: JournalEntryEditorProps) {
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dateRef = useRef<string | null>(null)

  // Tick once a minute so the "saved x min ago" stays fresh.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(interval)
  }, [])

  // Initialize savedAt from entry.updatedAt on entry change
  useEffect(() => {
    if (entry) {
      dateRef.current = entry.date
      const t = new Date(entry.updatedAt).getTime()
      setSavedAt(Number.isNaN(t) ? null : t)
    } else {
      dateRef.current = null
      setSavedAt(null)
    }
  }, [entry?.id])

  const handleChange = useCallback(
    (html: string) => {
      const date = dateRef.current
      if (!date) return
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onSaveContent(date, html)
        setSavedAt(Date.now())
      }, 500)
    },
    [onSaveContent],
  )

  const savedLabel = useMemo(() => formatRelative(savedAt, now), [savedAt, now])

  if (!entry) {
    return (
      <GlassCard padded>
        <p className="text-sm text-zinc-500">Select an entry to start writing.</p>
      </GlassCard>
    )
  }

  return (
    <GlassCard padded className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900">{prettyDate(entry.date)}</h2>
        {savedLabel && <span className="text-xs text-zinc-500">{savedLabel}</span>}
      </div>
      <TiptapEditor
        key={entry.id}
        content={entry.content}
        onChange={handleChange}
        placeholder="What's on your mind today?"
        className="min-h-[360px] border-none shadow-none"
      />
    </GlassCard>
  )
}
