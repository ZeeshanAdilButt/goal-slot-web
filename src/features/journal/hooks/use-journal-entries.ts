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

  const entries = query.data ?? []

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

  return {
    entries: sortedEntries,
    selectedEntry,
    selectedDate,
    selectDate,
    upsertContent,
    upsertMoodEnergy,
    isLoaded: !query.isLoading,
  }
}
