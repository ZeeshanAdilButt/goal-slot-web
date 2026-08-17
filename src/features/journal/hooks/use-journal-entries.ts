'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { coachApi, type CoachJournalEntryDto } from '@/lib/api'

export interface JournalEntry {
  id: string
  date: string // YYYY-MM-DD
  mood: number | null
  energy: number | null
  content: string // tiptap HTML (editor returns HTML)
  updatedAt: string // ISO
}

const QUERY_KEY = ['coach', 'journal', 'entries'] as const

// New entries used to be seeded with a starter template — guidance copy
// plus four section headings — written into the entry as REAL CONTENT and
// POSTed to the server before the user had typed a character. That made
// the guidance something you had to delete before you could write, which
// is the opposite of a hint. It also meant merely opening the Journal, or
// clicking a past date in the sidebar calendar, manufactured a "written"
// entry: 55 words of scaffold in the word count, and the same 55 words fed
// to the AI coach as if the user had reflected them.
//
// New entries are now created empty, which lets the placeholder that was
// already wired up (promptForDate in journal-entry-editor.tsx, rendered by
// TipTap's Placeholder extension) finally show. The guidance itself has
// not been dropped — it lives in the always-visible "Stuck?" banner above
// the editor, and the four-section layout is now one opt-in click in the
// "Untangle a feeling" dialog for people who liked the structure.
//
// The two template strings below are kept ONLY to recognise entries the
// old behaviour already wrote. See neutralizeScaffold.
const SCAFFOLD_TEMPLATES: readonly string[] = [
  // Original (#128) — headings only.
  "<h2>What happened today</h2><p></p><h2>How I felt</h2><p></p><h2>What worked, what didn't</h2><p></p><h2>One thing for tomorrow</h2><p></p>",
  // #172 — added the blockquote framing above the headings.
  '<blockquote><p><em>A feeling is usually a question your mind is trying to ask. Untangle one today — pick a thread below, or hit "Untangle a feeling" above the editor for more starters.</em></p></blockquote>' +
    '<h2>What was I feeling and what was it asking?</h2><p></p>' +
    '<h2>What happened today</h2><p></p>' +
    '<h2>What worked, what got in the way</h2><p></p>' +
    '<h2>One small adjustment for tomorrow</h2><p></p>',
]

/**
 * Reading fix for entries the old seeding already wrote to the database.
 *
 * An entry whose stored content is byte-identical to a scaffold template
 * is one nobody ever typed into, so it opens blank with the placeholder
 * instead of demanding a deletion first. This is deliberately read-side
 * only: nothing is rewritten or deleted on the server, and the moment a
 * single character differs — including an entry where the user kept the
 * headings and wrote under them — the content is passed through
 * completely untouched.
 */
function neutralizeScaffold(content: string): string {
  return SCAFFOLD_TEMPLATES.includes(content) ? '' : content
}

function todayKey(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function fromDto(dto: CoachJournalEntryDto): JournalEntry {
  return {
    id: dto.id,
    date: dto.date,
    mood: dto.mood,
    energy: dto.energy,
    content: neutralizeScaffold(dto.content ?? ''),
    updatedAt: dto.updatedAt,
  }
}

export function useJournalEntries() {
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [hasEnsuredToday, setHasEnsuredToday] = useState(false)

  const query = useQuery<JournalEntry[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await coachApi.listJournalEntries()
      return (res.data ?? []).map(fromDto)
    },
  })

  const ensureMutation = useMutation({
    mutationFn: async (date: string) => {
      // Create the row with NO content. The API leaves content at its ''
      // column default when the field is omitted, so the entry opens as a
      // genuinely blank page with a placeholder — nothing for the user to
      // clear before writing. Omitting the field (rather than sending '')
      // also means this can never blank an entry that already exists on a
      // server-side recreate path.
      const res = await coachApi.upsertJournalEntry({ date })
      return fromDto(res.data)
    },
    onSuccess: (entry) => {
      queryClient.setQueryData<JournalEntry[]>(QUERY_KEY, (prev) => {
        const list = prev ?? []
        if (list.some((e) => e.date === entry.date)) return list
        return [...list, entry]
      })
    },
  })

  const contentMutation = useMutation({
    mutationFn: async (vars: { date: string; content: string }) => {
      const res = await coachApi.updateJournalContent(vars.date, vars.content)
      return fromDto(res.data)
    },
    onSuccess: (entry) => {
      queryClient.setQueryData<JournalEntry[]>(QUERY_KEY, (prev) => {
        const list = prev ?? []
        const idx = list.findIndex((e) => e.date === entry.date)
        if (idx === -1) return [...list, entry]
        const next = [...list]
        next[idx] = entry
        return next
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (date: string) => {
      await coachApi.deleteJournalEntry(date)
      return date
    },
    onSuccess: (date) => {
      queryClient.setQueryData<JournalEntry[]>(QUERY_KEY, (prev) => {
        const list = prev ?? []
        return list.filter((e) => e.date !== date)
      })
    },
  })

  const moodMutation = useMutation({
    mutationFn: async (vars: { date: string; mood: number | null; energy: number | null }) => {
      const res = await coachApi.updateJournalMood(vars.date, vars.mood, vars.energy)
      return fromDto(res.data)
    },
    onSuccess: (entry) => {
      queryClient.setQueryData<JournalEntry[]>(QUERY_KEY, (prev) => {
        const list = prev ?? []
        const idx = list.findIndex((e) => e.date === entry.date)
        if (idx === -1) return [...list, entry]
        const next = [...list]
        next[idx] = entry
        return next
      })
    },
  })

  // Once the list loads, ensure today's entry exists and select it.
  useEffect(() => {
    if (query.isLoading || hasEnsuredToday) return
    const td = todayKey()
    const list = query.data ?? []
    if (list.some((e) => e.date === td)) {
      setSelectedDate((cur) => cur ?? td)
      setHasEnsuredToday(true)
      return
    }
    setHasEnsuredToday(true)
    ensureMutation.mutate(td, {
      onSuccess: () => {
        setSelectedDate((cur) => cur ?? td)
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.isLoading, query.data, hasEnsuredToday])

  const entries = useMemo(() => query.data ?? [], [query.data])

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [entries],
  )

  const selectedEntry = useMemo(
    () => entries.find((e) => e.date === selectedDate) ?? null,
    [entries, selectedDate],
  )

  const selectDate = useCallback(
    (date: string) => {
      const list = queryClient.getQueryData<JournalEntry[]>(QUERY_KEY) ?? []
      if (list.some((e) => e.date === date)) {
        setSelectedDate(date)
        return
      }
      // Optimistically insert a stub entry into the cache so selectedEntry is
      // non-null immediately, no flicker to the "select an entry" empty state.
      // Empty content, matching what the upsert below now creates — a blank
      // page with a placeholder, not scaffold the user has to delete.
      const stub: JournalEntry = {
        id: `tmp_${date}`,
        date,
        mood: null,
        energy: null,
        content: '',
        updatedAt: new Date().toISOString(),
      }
      queryClient.setQueryData<JournalEntry[]>(QUERY_KEY, (prev) => {
        const cur = prev ?? []
        if (cur.some((e) => e.date === date)) return cur
        return [...cur, stub]
      })
      setSelectedDate(date)
      // Server upsert; onSuccess replaces the stub with the real row (real id).
      ensureMutation.mutate(date)
    },
    [ensureMutation, queryClient],
  )

  const upsertContent = useCallback(
    (date: string, content: string) => {
      contentMutation.mutate({ date, content })
    },
    [contentMutation],
  )

  const upsertMoodEnergy = useCallback(
    (date: string, mood: number | null, energy: number | null) => {
      moodMutation.mutate({ date, mood, energy })
    },
    [moodMutation],
  )

  const deleteEntry = useCallback(
    (date: string) => {
      deleteMutation.mutate(date)
      // If the deleted entry was selected, fall back to the next entry
      // in the list (most recent) so the editor isn't left empty.
      setSelectedDate((cur) => {
        if (cur !== date) return cur
        const remaining = (query.data ?? []).filter((e) => e.date !== date)
        return remaining[0]?.date ?? null
      })
    },
    [deleteMutation, query.data],
  )

  return {
    entries: sortedEntries,
    selectedEntry,
    selectedDate,
    selectDate,
    upsertContent,
    upsertMoodEnergy,
    deleteEntry,
    isLoaded: !query.isLoading,
  }
}
