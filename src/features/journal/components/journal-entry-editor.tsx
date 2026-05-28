'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { JournalEntry } from '@/features/journal/hooks/use-journal-entries'
import { Check, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { TiptapEditor } from '@/components/tiptap-editor/tiptap-editor'

interface JournalEntryEditorProps {
  entry: JournalEntry | null
  onSaveContent: (date: string, content: string) => void
}

function formatRelative(savedAt: number | null, now: number): string {
  if (!savedAt) return ''
  const diffMs = Math.max(0, now - savedAt)
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 5) return 'just now'
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hr ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`
}

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function prettyDate(date: string, today: string): string {
  const d = new Date(`${date}T00:00:00`)
  if (Number.isNaN(d.getTime())) return date
  const weekday = d.toLocaleDateString(undefined, { weekday: 'long' })
  const month = d.toLocaleDateString(undefined, { month: 'long' })
  const day = d.getDate()
  const year = d.getFullYear()
  const todayYear = new Date(`${today}T00:00:00`).getFullYear()
  const prefix = date === today ? 'Today - ' : ''
  return year === todayYear
    ? `${prefix}${weekday}, ${month} ${day}`
    : `${prefix}${weekday}, ${month} ${day}, ${year}`
}

function countWords(html: string): number {
  if (!html) return 0
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ')
  const tokens = text.trim().split(/\s+/).filter(Boolean)
  return tokens.length
}

const PROMPTS = [
  "What's on your mind today?",
  'Write whatever wants to come out, a sentence or a page.',
  'What worked? What got in the way?',
  'How do you actually feel right now?',
  'What did you learn today?',
]

function promptForDate(date: string): string {
  // Deterministic pick so the prompt is stable per day.
  let hash = 0
  for (let i = 0; i < date.length; i++) hash = (hash * 31 + date.charCodeAt(i)) >>> 0
  return PROMPTS[hash % PROMPTS.length]
}

export function JournalEntryEditor({ entry, onSaveContent }: JournalEntryEditorProps) {
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [pendingSave, setPendingSave] = useState(false)
  const [liveContent, setLiveContent] = useState<string>(entry?.content ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dateRef = useRef<string | null>(null)

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (entry) {
      dateRef.current = entry.date
      const t = new Date(entry.updatedAt).getTime()
      setSavedAt(Number.isNaN(t) ? null : t)
      setLiveContent(entry.content ?? '')
    } else {
      dateRef.current = null
      setSavedAt(null)
      setLiveContent('')
    }
  }, [entry?.id])

  const handleChange = useCallback(
    (html: string) => {
      const date = dateRef.current
      if (!date) return
      setLiveContent(html)
      setPendingSave(true)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onSaveContent(date, html)
        setSavedAt(Date.now())
        setPendingSave(false)
      }, 500)
    },
    [onSaveContent],
  )

  const today = todayKey()
  const savedLabel = useMemo(() => formatRelative(savedAt, now), [savedAt, now])
  const wordCount = useMemo(() => countWords(liveContent), [liveContent])

  // Even with no entry yet (shouldn't really happen — hook auto-creates today's),
  // render a welcoming today shell so the user can start typing immediately.
  const effectiveDate = entry?.date ?? today
  const isToday = effectiveDate === today

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-zinc-100 bg-gradient-to-br from-[#fffbea] to-white px-5 py-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8a7307]">
            {isToday ? "Today's entry" : 'Journal entry'}
          </div>
          <h2 className="mt-0.5 text-xl font-semibold text-zinc-900">
            {prettyDate(effectiveDate, today)}
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="hidden sm:inline">{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
          <span aria-hidden className="hidden h-1 w-1 rounded-full bg-zinc-300 sm:inline-block" />
          <span
            className={cn(
              'inline-flex items-center gap-1',
              pendingSave ? 'text-zinc-500' : 'text-emerald-700',
            )}
          >
            {pendingSave ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" /> Saving...
              </>
            ) : savedAt ? (
              <>
                <Check className="h-3 w-3" /> Saved {savedLabel}
              </>
            ) : (
              <span className="text-zinc-400">Autosaves as you type</span>
            )}
          </span>
        </div>
      </div>

      <div className="min-w-0 overflow-x-auto px-2 py-3 sm:px-4">
        <TiptapEditor
          key={entry?.id ?? effectiveDate}
          content={entry?.content ?? ''}
          onChange={handleChange}
          placeholder={promptForDate(effectiveDate)}
          className="min-h-[420px] border-none shadow-none"
        />
      </div>
    </div>
  )
}
