'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { useCreateNoteMutation, useNotesQuery } from '@/features/notes/hooks/use-notes'
import type { Note } from '@/features/notes/utils/types'

const LAST_NOTE_KEY = 'dw-last-note-id'

interface UseNotesSelectionArgs {
  initialNoteId?: string
}

/**
 * Owns note selection across desktop + mobile layouts.
 *
 *  - The selected note ID is local state; the resolved Note object is derived
 *    from the React Query cache on every render so optimistic mutations
 *    (favorite toggles, color changes, etc.) propagate immediately without
 *    waiting for a switch-and-come-back round trip.
 *  - URL query param (`?noteId=`) is the source of truth for first paint.
 *  - Falls back to initialNoteId prop, then localStorage, then the first note.
 *  - Persists the last picked id to localStorage.
 */
export function useNotesSelection({ initialNoteId }: UseNotesSelectionArgs = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const { data: notes = [], isLoading } = useNotesQuery()
  const createMutation = useCreateNoteMutation()
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)

  // First-paint resolution. Picks an id from URL → initialNoteId → localStorage
  // → first note. Only runs until selectedNoteId is set or notes load.
  useEffect(() => {
    if (isLoading || notes.length === 0) return
    if (selectedNoteId) {
      if (!hasInitialized) setHasInitialized(true)
      return
    }

    const paramNoteId = searchParams.get('noteId')
    let idToSelect: string | undefined

    if (paramNoteId && notes.some((n) => n.id === paramNoteId)) idToSelect = paramNoteId
    if (!idToSelect && initialNoteId && notes.some((n) => n.id === initialNoteId)) {
      idToSelect = initialNoteId
    }
    if (!idToSelect && !paramNoteId) {
      const lastNoteId =
        typeof window !== 'undefined' ? window.localStorage.getItem(LAST_NOTE_KEY) : null
      if (lastNoteId && notes.some((n) => n.id === lastNoteId)) idToSelect = lastNoteId
    }
    if (!idToSelect) idToSelect = notes[0]?.id

    if (idToSelect) {
      setSelectedNoteId(idToSelect)
      if (typeof window !== 'undefined') window.localStorage.setItem(LAST_NOTE_KEY, idToSelect)
      if (!paramNoteId) {
        const params = new URLSearchParams(searchParams.toString())
        params.set('noteId', idToSelect)
        router.replace(`${pathname}?${params.toString()}`)
      }
    }

    if (!hasInitialized) setHasInitialized(true)
  }, [notes, isLoading, initialNoteId, hasInitialized, searchParams, selectedNoteId, router, pathname])

  // Derive the selected note from the cache so cache updates (optimistic
  // color/favorite/title changes) re-render the editor instantly.
  const selectedNote = useMemo<Note | null>(
    () => notes.find((n) => n.id === selectedNoteId) ?? null,
    [notes, selectedNoteId],
  )

  const selectNote = useCallback(
    (note: Note) => {
      setSelectedNoteId(note.id)
      if (typeof window !== 'undefined') window.localStorage.setItem(LAST_NOTE_KEY, note.id)
      const params = new URLSearchParams(searchParams.toString())
      params.set('noteId', note.id)
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams],
  )

  const createNote = useCallback(() => {
    createMutation.mutate(
      { title: 'Untitled', content: '[]' },
      { onSuccess: (newNote) => selectNote(newNote) },
    )
  }, [createMutation, selectNote])

  const deleteSelectedNote = useCallback(() => {
    if (notes.length > 1) {
      const next = notes.find((n) => n.id !== selectedNoteId)
      if (next) {
        selectNote(next)
        return
      }
    }
    setSelectedNoteId(null)
    router.replace(pathname)
  }, [notes, pathname, router, selectNote, selectedNoteId])

  return {
    notes,
    isLoading,
    selectedNote,
    selectNote,
    createNote,
    isCreating: createMutation.isPending,
    deleteSelectedNote,
  }
}
