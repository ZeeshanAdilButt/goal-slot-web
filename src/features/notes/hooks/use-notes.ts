import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { notesApi } from '@/lib/api'

import { Note, CreateNoteDto, UpdateNoteDto } from '../utils/types'

// Query key for notes
export const NOTES_QUERY_KEY = ['notes']

// Fetch all notes
export function useNotesQuery() {
  return useQuery({
    queryKey: NOTES_QUERY_KEY,
    queryFn: async () => {
      const { data } = await notesApi.getAll()
      return data as Note[]
    },
  })
}

// Fetch single note
export function useNoteQuery(id: string | null) {
  return useQuery({
    queryKey: [...NOTES_QUERY_KEY, id],
    queryFn: async () => {
      if (!id) return null
      const { data } = await notesApi.getOne(id)
      return data as Note
    },
    enabled: !!id,
  })
}

// Create note mutation — optimistic. A tmp_ note is inserted into the
// cache immediately so the sidebar row shows up the moment the user
// clicks +; the server round-trip happens in the background. On
// success the tmp row is swapped for the real one (real id, real
// timestamps, real ordering); on error we roll back and toast.
export function useCreateNoteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateNoteDto) => {
      const response = await notesApi.create(data)
      return response.data as Note
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: NOTES_QUERY_KEY })
      const previous = queryClient.getQueryData<Note[]>(NOTES_QUERY_KEY)
      const tmpId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const now = new Date()
      // Append: server will resolve the real order on persist; appending
      // beats prepending because the user expects a freshly-added note
      // to land at the bottom of its sibling list.
      const siblings = (previous ?? []).filter(
        (n) => (n.parentId ?? null) === (data.parentId ?? null),
      )
      const maxOrder = siblings.reduce((m, n) => Math.max(m, n.order ?? 0), 0)
      const optimistic: Note = {
        id: tmpId,
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
      queryClient.setQueryData<Note[]>(NOTES_QUERY_KEY, (prev) => {
        const list = prev ?? []
        return [...list, optimistic]
      })
      return { previous, tmpId }
    },
    onSuccess: (newNote, _vars, context) => {
      // Replace the tmp row with the server's real row in-place so the
      // visual position doesn't jump when the network resolves.
      queryClient.setQueryData<Note[]>(NOTES_QUERY_KEY, (prev) => {
        if (!prev) return prev
        const tmpId = context?.tmpId
        if (!tmpId) return [...prev.filter((n) => n.id !== newNote.id), newNote]
        return prev.map((n) => (n.id === tmpId ? newNote : n))
      })
      // Background reconcile so anything we didn't predict (timestamps,
      // computed fields) catches up without blocking the UI.
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY, refetchType: 'inactive' })
    },
    onError: (error: any, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(NOTES_QUERY_KEY, context.previous)
      }
      toast.error(error.response?.data?.message || 'Failed to create note')
    },
  })
}

// Update note mutation, optimistic so toggles (favorite, expand) feel instant.
export function useUpdateNoteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateNoteDto }) => {
      const response = await notesApi.update(id, data)
      return response.data as Note
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: NOTES_QUERY_KEY })
      const previous = queryClient.getQueryData<Note[]>(NOTES_QUERY_KEY)
      queryClient.setQueryData<Note[]>(NOTES_QUERY_KEY, (prev) => {
        if (!prev) return prev
        return prev.map((n) => (n.id === id ? { ...n, ...data } : n))
      })
      return { previous }
    },
    onError: (error: any, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(NOTES_QUERY_KEY, context.previous)
      toast.error(error.response?.data?.message || 'Failed to update note')
    },
    // No invalidate on success, the optimistic patch is already correct.
    // Server can drift only on serialized fields the user can't see (createdAt updates etc).
    onSettled: () => {
      // Background refetch so the cache eventually reconciles, but the UI does
      // not block on it.
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY, refetchType: 'inactive' })
    },
  })
}

// Delete note mutation
export function useDeleteNoteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await notesApi.delete(id)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY })
      toast.success('Note deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete note')
    },
  })
}

// Reorder notes mutation
export function useReorderNotesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { noteId: string; parentId: string | null; order: number }[]) => {
      await notesApi.reorder(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reorder notes')
    },
  })
}
