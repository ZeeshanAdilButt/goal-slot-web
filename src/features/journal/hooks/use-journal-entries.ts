'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'goalslot:coach:journal:entries'

export interface JournalEntry {
  id: string
  date: string // YYYY-MM-DD
  mood: number | null
  energy: number | null
  content: string // tiptap HTML (editor returns HTML)
  updatedAt: string // ISO
}

function todayKey(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function makeId() {
  return `je_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function readEntries(): JournalEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as JournalEntry[]
  } catch {
    return []
  }
}

function writeEntries(entries: JournalEntry[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

function ensureToday(entries: JournalEntry[]): { entries: JournalEntry[]; todayDate: string } {
  const td = todayKey()
  if (entries.some((e) => e.date === td)) {
    return { entries, todayDate: td }
  }
  const fresh: JournalEntry = {
    id: makeId(),
    date: td,
    mood: null,
    energy: null,
    content: '',
    updatedAt: new Date().toISOString(),
  }
  return { entries: [...entries, fresh], todayDate: td }
}

export function useJournalEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Hydrate from localStorage + auto-create today's entry
  useEffect(() => {
    const existing = readEntries()
    const { entries: withToday, todayDate } = ensureToday(existing)
    setEntries(withToday)
    setSelectedDate(todayDate)
    if (withToday.length !== existing.length) {
      writeEntries(withToday)
    }
    setIsLoaded(true)
  }, [])

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [entries],
  )

  const selectedEntry = useMemo(
    () => entries.find((e) => e.date === selectedDate) ?? null,
    [entries, selectedDate],
  )

  const selectDate = useCallback((date: string) => {
    setSelectedDate(date)
  }, [])

  const upsertContent = useCallback((date: string, content: string) => {
    setEntries((prev) => {
      const next = [...prev]
      const idx = next.findIndex((e) => e.date === date)
      if (idx === -1) {
        next.push({
          id: makeId(),
          date,
          mood: null,
          energy: null,
          content,
          updatedAt: new Date().toISOString(),
        })
      } else {
        next[idx] = { ...next[idx], content, updatedAt: new Date().toISOString() }
      }
      writeEntries(next)
      return next
    })
  }, [])

  const upsertMoodEnergy = useCallback((date: string, mood: number | null, energy: number | null) => {
    setEntries((prev) => {
      const next = [...prev]
      const idx = next.findIndex((e) => e.date === date)
      if (idx === -1) {
        next.push({
          id: makeId(),
          date,
          mood,
          energy,
          content: '',
          updatedAt: new Date().toISOString(),
        })
      } else {
        next[idx] = { ...next[idx], mood, energy, updatedAt: new Date().toISOString() }
      }
      writeEntries(next)
      return next
    })
  }, [])

  return {
    entries: sortedEntries,
    selectedEntry,
    selectedDate,
    selectDate,
    upsertContent,
    upsertMoodEnergy,
    isLoaded,
  }
}
