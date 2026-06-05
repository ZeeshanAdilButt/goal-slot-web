import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { releaseNotesApi } from '@/lib/api'
import type { LatestReleaseNoteResponse, ReleaseNote } from '@/features/release-notes/utils/types'

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
  return useQuery<ReleaseNote[]>({
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
    // Optimistic update. The instant the user clicks "Got it", drop the
    // note from the unseen list and flip the latest-note seen flag in
    // cache. The network call still runs in the background. Previously
    // this logic lived in onSuccess, so the button visibly hung on slow
    // connections waiting for the round-trip.
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: unseenReleaseNotesKey })
      await queryClient.cancelQueries({ queryKey: latestReleaseNoteKey })

      const prevUnseen = queryClient.getQueryData<ReleaseNote[]>(unseenReleaseNotesKey)
      const prevLatest = queryClient.getQueryData<LatestReleaseNoteResponse>(latestReleaseNoteKey)

      queryClient.setQueryData<ReleaseNote[]>(unseenReleaseNotesKey, (old) =>
        (old ?? []).filter((note) => note.id !== id),
      )
      queryClient.setQueryData<LatestReleaseNoteResponse>(latestReleaseNoteKey, (old) => {
        if (!old || !old.note || old.note.id !== id) return old
        return { ...old, seen: true }
      })

      // Returned context is handed to onError for rollback.
      return { prevUnseen, prevLatest }
    },
    onError: (_err, _id, context) => {
      // Roll back if the API actually failed. The banner will reappear
      // which is the correct signal that we did not persist "seen".
      if (context?.prevUnseen) {
        queryClient.setQueryData(unseenReleaseNotesKey, context.prevUnseen)
      }
      if (context?.prevLatest) {
        queryClient.setQueryData(latestReleaseNoteKey, context.prevLatest)
      }
    },
  })
}
