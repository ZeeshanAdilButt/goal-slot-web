import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useOfflineMutation } from '@/hooks/use-offline-mutation'
import { notesApi } from '@/lib/api'

import { Note, CreateNoteDto, UpdateNoteDto } from '../utils/types'

import '@/features/notes/utils/offline-operations'

// Query key for notes
export const NOTES_QUERY_KEY = ['notes']
export const SHARED_NOTES_QUERY_KEY = ['notes', 'shared-with-me']

// Fetch all notes owned by the current user
export function useNotesQuery() {
  return useQuery({
    queryKey: NOTES_QUERY_KEY,
    queryFn: async () => {
      const { data } = await notesApi.getAll()
      return data as Note[]
    },
  })
}

// Fetch the single-note response (owner OR share recipient). Returns
// { note, readOnly }; readOnly is true for share recipients.
export function useNoteQuery(id: string | null) {
  return useQuery({
    queryKey: [...NOTES_QUERY_KEY, id],
    queryFn: async () => {
      if (!id) return null
      const { data } = await notesApi.getOne(id)
      return data as { note: Note; readOnly: boolean }
    },
    enabled: !!id,
  })
}

// Notes shared with the current user. Each entry carries the note
// metadata + owner info so the sidebar can show "shared by <name>".
export interface SharedNoteSummary {
  shareId: string
  note: {
    id: string
    title: string
    icon: string | null
    color: string | null
    updatedAt: string
  }
  owner: {
    id: string
    name: string
    email: string
    avatar: string | null
  }
  acceptedAt: string | null
  createdAt: string
  permission: string
}

export function useSharedNotesQuery() {
  return useQuery({
    queryKey: SHARED_NOTES_QUERY_KEY,
    queryFn: async () => {
      const { data } = await notesApi.sharedWithMe()
      return data as SharedNoteSummary[]
    },
  })
}

// Create note mutation — optimistic. A tmp_ note is inserted into the
// cache immediately so the sidebar row shows up the moment the user
// clicks +; the server round-trip happens in the background. On
// success the tmp row is swapped for the real one (real id, real
// timestamps, real ordering); on error we roll back and toast.
export function useCreateNoteMutation() {
  const queryClient = useQueryClient()

  const buildOptimisticNote = (data: CreateNoteDto, id: string): Note => {
    const now = new Date()
    const current = queryClient.getQueryData<Note[]>(NOTES_QUERY_KEY) ?? []
    const siblings = current.filter((n) => (n.parentId ?? null) === (data.parentId ?? null))
    const maxOrder = siblings.reduce((m, n) => Math.max(m, n.order ?? 0), 0)

    return {
      id,
      title: data.title,
      content: data.content ?? '',
      icon: data.icon,
      color: data.color,
      parentId: data.parentId ?? null,
      order: maxOrder + 1000,
      isExpanded: false,
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
      userId: '',
    }
  }

  return useOfflineMutation<CreateNoteDto, { previous: Note[] | undefined }, Note>({
    kind: 'note.create',
    buildPayload: (data, meta) => ({ id: meta.entityId, ...data }),
    getQueuedResult: (data, meta) => buildOptimisticNote(data, meta.entityId),
    optimisticUpdate: (data, meta) => {
      const previous = queryClient.getQueryData<Note[]>(NOTES_QUERY_KEY)
      const optimistic = buildOptimisticNote(data, meta.entityId)
      queryClient.setQueryData<Note[]>(NOTES_QUERY_KEY, (prev) => {
        const list = prev ?? []
        return [...list, optimistic]
      })
      return { previous }
    },
    rollback: (ctx) => queryClient.setQueryData(NOTES_QUERY_KEY, ctx?.previous),
    invalidateKeys: [NOTES_QUERY_KEY],
    messages: {
      offline: 'Note saved offline',
      error: 'Failed to create note',
    },
  })
}

// Update note mutation, optimistic so toggles (favorite, expand) feel instant.
export function useUpdateNoteMutation() {
  const queryClient = useQueryClient()

  return useOfflineMutation<{ id: string; data: UpdateNoteDto }, { previous: Note[] | undefined }>({
    kind: 'note.update',
    buildPayload: ({ id, data }) => ({ id, data }),
    optimisticUpdate: ({ id, data }) => {
      const previous = queryClient.getQueryData<Note[]>(NOTES_QUERY_KEY)
      queryClient.setQueryData<Note[]>(NOTES_QUERY_KEY, (prev) => {
        if (!prev) return prev
        return prev.map((n) => (n.id === id ? { ...n, ...data } : n))
      })
      return { previous }
    },
    rollback: (ctx) => queryClient.setQueryData(NOTES_QUERY_KEY, ctx?.previous),
    invalidateKeys: [NOTES_QUERY_KEY],
    messages: {
      offline: 'Note update saved offline',
      error: 'Failed to update note',
    },
  })
}

// Delete note mutation
export function useDeleteNoteMutation() {
  const queryClient = useQueryClient()

  return useOfflineMutation<string, { previous: Note[] | undefined }>({
    kind: 'note.delete',
    buildPayload: (id) => ({ id }),
    optimisticUpdate: (id) => {
      const previous = queryClient.getQueryData<Note[]>(NOTES_QUERY_KEY)
      queryClient.setQueryData<Note[]>(NOTES_QUERY_KEY, (prev) => prev?.filter((note) => note.id !== id))
      return { previous }
    },
    rollback: (ctx) => queryClient.setQueryData(NOTES_QUERY_KEY, ctx?.previous),
    invalidateKeys: [NOTES_QUERY_KEY],
    messages: {
      offline: 'Note deletion saved offline',
      success: 'Note deleted successfully',
      error: 'Failed to delete note',
    },
  })
}

// Reorder notes mutation — optimistic. The drag UI needs to feel
// instant; waiting for the server roundtrip before the row visibly
// moves was the user-reported "movements take some time to register"
// complaint. We apply the parentId/order rewrite to the cache on
// onMutate, then reconcile in the background.
export function useReorderNotesMutation() {
  const queryClient = useQueryClient()

  return useOfflineMutation<
    { noteId: string; parentId: string | null; order: number }[],
    { previous: Note[] | undefined }
  >({
    kind: 'note.reorder',
    buildPayload: (data) => data,
    optimisticUpdate: (updates) => {
      const previous = queryClient.getQueryData<Note[]>(NOTES_QUERY_KEY)
      queryClient.setQueryData<Note[]>(NOTES_QUERY_KEY, (prev) => {
        if (!prev) return prev
        const updateById = new Map(updates.map((u) => [u.noteId, u]))
        return prev.map((n) => {
          const u = updateById.get(n.id)
          if (!u) return n
          return { ...n, parentId: u.parentId, order: u.order }
        })
      })
      return { previous }
    },
    rollback: (ctx) => queryClient.setQueryData(NOTES_QUERY_KEY, ctx?.previous),
    invalidateKeys: [NOTES_QUERY_KEY],
    messages: {
      offline: 'Note reorder saved offline',
      error: 'Failed to reorder notes',
    },
  })
}
