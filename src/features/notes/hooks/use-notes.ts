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

// Create note mutation
export function useCreateNoteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateNoteDto) => {
      const response = await notesApi.create(data)
      return response.data as Note
    },
    onSuccess: (newNote) => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY })
      toast.success('Note created successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create note')
    },
  })
}

// Update note mutation
export function useUpdateNoteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateNoteDto }) => {
      const response = await notesApi.update(id, data)
      return response.data as Note
    },
    onSuccess: (updatedNote) => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update note')
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
