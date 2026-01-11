import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { releaseNotesApi } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { ReleaseNote } from '../utils/types'

export function useReleaseNotesList() {
  return useQuery<ReleaseNote[]>({
    queryKey: ['release-notes', 'list'],
    queryFn: async () => {
      const res = await releaseNotesApi.list()
      return res.data
    },
  })
}

export function useDeleteReleaseNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await releaseNotesApi.delete(id)
      return res.data
    },
    onSuccess: () => {
      toast.success('Release note deleted')
      queryClient.invalidateQueries({ queryKey: ['release-notes', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['release-notes', 'latest'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete release note')
    },
  })
}
