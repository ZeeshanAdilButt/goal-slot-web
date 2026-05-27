'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { useCreateNoteMutation, useNotesQuery } from '@/features/notes/hooks/use-notes'
import type { Note } from '@/features/notes/utils/types'

const LAST_NOTE_KEY = 'dw-last-note-id'

interface UseNotesSelectionArgs {
  initialNoteId?: string
}

/**
 * Owns note selection across desktop + mobile layouts:
 *  - URL query param (`?noteId=`) is the source of truth
 *  - Falls back to initialNoteId prop, then localStorage, then first note
 *  - Persists the last picked id to localStorage
 *  - Provides create / delete handlers that keep state + URL coherent
 */
export function useNotesSelection({ initialNoteId }: UseNotesSelectionArgs = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const { data: notes = [], isLoading } = useNotesQuery()
  const createMutation = useCreateNoteMutation()
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)

  useEffect(() => {
    if (isLoading || notes.length === 0) return

    const paramNoteId = searchParams.get('noteId')
    let noteToSelect: Note | undefined

    if (paramNoteId) noteToSelect = notes.find((n) => n.id === paramNoteId)
    if (!noteToSelect && initialNoteId && !hasInitialized) {
      noteToSelect = notes.find((n) => n.id === initialNoteId)
    }
    if (!noteToSelect && !paramNoteId && !hasInitialized) {
      const lastNoteId = typeof window !== 'undefined' ? window.localStorage.getItem(LAST_NOTE_KEY) : null
      if (lastNoteId) noteToSelect = notes.find((n) => n.id === lastNoteId)
    }
    if (!noteToSelect && !selectedNote) noteToSelect = notes[0]

    if (noteToSelect && noteToSelect.id !== selectedNote?.id) {
      setSelectedNote(noteToSelect)
      if (typeof window !== 'undefined') window.localStorage.setItem(LAST_NOTE_KEY, noteToSelect.id)
      if (!paramNoteId) {
        const params = new URLSearchParams(searchParams.toString())
        params.set('noteId', noteToSelect.id)
        router.replace(`${pathname}?${params.toString()}`)
      }
    }

    if (!hasInitialized) setHasInitialized(true)
  }, [notes, isLoading, initialNoteId, hasInitialized, searchParams, selectedNote, router, pathname])

  const selectNote = useCallback(
    (note: Note) => {
      setSelectedNote(note)
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
      const next = notes.find((n) => n.id !== selectedNote?.id)
      if (next) {
        selectNote(next)
        return
      }
    }
    setSelectedNote(null)
    router.replace(pathname)
  }, [notes, pathname, router, selectNote, selectedNote])

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
