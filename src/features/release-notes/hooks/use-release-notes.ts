import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { releaseNotesApi } from '@/lib/api'
import type { LatestReleaseNoteResponse } from '@/features/release-notes/utils/types'

const latestReleaseNoteKey = ['release-notes', 'latest'] as const

export function useLatestReleaseNote() {
  return useQuery<LatestReleaseNoteResponse>({
    queryKey: latestReleaseNoteKey,
    queryFn: async () => {
      const res = await releaseNotesApi.latest()
      return res.data as LatestReleaseNoteResponse
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache to avoid repeated calls during a session
    gcTime: 1000 * 60 * 60 * 6, // keep in cache for reuse
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  })
}

export function useMarkReleaseNoteSeen() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await releaseNotesApi.markSeen(id)
      return res.data
    },
    onSuccess: (_, variables) => {
      queryClient.setQueryData<LatestReleaseNoteResponse>(latestReleaseNoteKey, (old) => {
        if (!old || !old.note || old.note.id !== variables) return old
        return { ...old, seen: true }
      })
    },
  })
}
