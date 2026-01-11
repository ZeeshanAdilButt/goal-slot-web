import { useMutation, useQueryClient } from '@tanstack/react-query'
import { releaseNotesApi } from '@/lib/api'
import { toast } from 'react-hot-toast'

export function useCreateReleaseNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { version: string; title: string; content: string; publishedAt?: string }) => {
      const res = await releaseNotesApi.create(data)
      return res.data
    },
    onSuccess: () => {
      toast.success('Release note published')
      queryClient.invalidateQueries({ queryKey: ['release-notes', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['release-notes', 'latest'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to publish release note')
    },
  })
}

export function useUpdateReleaseNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { version?: string; title?: string; content?: string; publishedAt?: string; resetSeen?: boolean } }) => {
      const res = await releaseNotesApi.update(id, data)
      return res.data
    },
    onSuccess: () => {
      toast.success('Release note updated')
      queryClient.invalidateQueries({ queryKey: ['release-notes', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['release-notes', 'latest'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update release note')
    },
  })
}
