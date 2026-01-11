import { useMutation } from '@tanstack/react-query'
import { releaseNotesApi } from '@/lib/api'
import { toast } from 'react-hot-toast'

export function useCreateReleaseNote() {
  return useMutation({
    mutationFn: async (data: { version: string; title: string; content: string; publishedAt?: string }) => {
      const res = await releaseNotesApi.create(data)
      return res.data
    },
    onSuccess: () => {
      toast.success('Release note published')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to publish release note')
    },
  })
}
