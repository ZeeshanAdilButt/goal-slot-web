import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { releaseNotesApi } from '@/lib/api'
import type { LatestReleaseNoteResponse } from '@/features/release-notes/utils/types'

const latestReleaseNoteKey = ['release-notes', 'latest'] as const
const unseenReleaseNotesKey = ['release-notes', 'unseen'] as const

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

export function useUnseenReleaseNotes() {
  return useQuery<{
    note: {
      id: string;
      version: string;
      title: string;
      content: string;
      publishedAt: string;
    }
  }[]>({
    queryKey: unseenReleaseNotesKey,
    queryFn: async () => {
      const res = await releaseNotesApi.unseen()
      // API returns an array of ReleaseNote objects
      return res.data
    },
    staleTime: 1000 * 60 * 60, // check once per hour
    refetchOnWindowFocus: false,
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
      // Update latest note cache
      queryClient.setQueryData<LatestReleaseNoteResponse>(latestReleaseNoteKey, (old) => {
        if (!old || !old.note || old.note.id !== variables) return old
        return { ...old, seen: true }
      })

      // Update unseen list cache - remove the seen note
      queryClient.setQueryData<any[]>(unseenReleaseNotesKey, (old) => {
        if (!old) return []
        return old.filter((note) => note.id !== variables)
      })
    },
  })
}
