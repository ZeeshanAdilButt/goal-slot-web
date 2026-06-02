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

// Default starter template for a brand-new daily entry. Plain HTML so
// TipTap renders it as real headings + paragraphs the user can edit or
// delete inline.
//
// Opens with the framing we landed on: feelings are questions your
// mind is trying to ask, and journaling is how you untangle them
// into something you can actually answer. The blockquote stays small
// and removable — it's a nudge, not a wall. Then the four standard
// sections so the user can fill in or delete as suits the day.
const DEFAULT_ENTRY_TEMPLATE =
  '<blockquote><p><em>A feeling is usually a question your mind is trying to ask. Untangle one today — pick a thread below, or hit "Untangle a feeling" above the editor for more starters.</em></p></blockquote>' +
  '<h2>What was I feeling and what was it asking?</h2><p></p>' +
  '<h2>What happened today</h2><p></p>' +
  '<h2>What worked, what got in the way</h2><p></p>' +
  '<h2>One small adjustment for tomorrow</h2><p></p>'

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
    content: dto.content ?? '',
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
      // Seed brand-new entries with a quiet, human starting template
      // — no emojis, no "AI assistant" framing, just four soft prompts
      // the writer can fill in or delete. The check guards against
      // clobbering an existing entry on a server-side recreate path.
      const res = await coachApi.upsertJournalEntry({
        date,
        content: DEFAULT_ENTRY_TEMPLATE,
      })
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
      // Seed with the default template so the user lands on the same starter
      // prompts as a brand-new "today" entry — past-date entries used to
      // open blank because the stub had content='' while the real upsert
      // (which sends DEFAULT_ENTRY_TEMPLATE) was still in flight.
      const stub: JournalEntry = {
        id: `tmp_${date}`,
        date,
        mood: null,
        energy: null,
        content: DEFAULT_ENTRY_TEMPLATE,
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
