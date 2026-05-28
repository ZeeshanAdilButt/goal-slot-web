import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { feedbackApi } from '@/lib/api'
import type { FeedbackResponse, FeedbackThreadResponse } from '@/features/feedback/utils/types'

const feedbackThreadKey = (id: string) => ['feedback', 'thread', id] as const

export function useFeedbackThreadQuery(feedbackId?: string, enabled = true) {
  return useQuery<FeedbackThreadResponse>({
    queryKey: feedbackId ? feedbackThreadKey(feedbackId) : ['feedback', 'thread', 'disabled'],
    queryFn: async () => {
      if (!feedbackId) throw new Error('feedbackId required')
      const res = await feedbackApi.getThread(feedbackId)
      return res.data as FeedbackThreadResponse
    },
    enabled: enabled && Boolean(feedbackId),
  })
}

export function useCreateFeedbackResponseMutation(feedbackId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (message: string) => {
      const res = await feedbackApi.reply(feedbackId, { message })
      return res.data as FeedbackResponse
    },
    // Merge the returned response into the cached thread immediately so the
    // reply appears in the UI without waiting for the refetch to land.
    // Without this, the network refetch occasionally races the optimistic
    // close-and-clear and the reply doesn't show until manual refresh.
    onSuccess: (response) => {
      queryClient.setQueryData<FeedbackThreadResponse | undefined>(
        feedbackThreadKey(feedbackId),
        (prev) => {
          if (!prev) return prev
          if (prev.responses.some((r) => r.id === response.id)) return prev
          return { ...prev, responses: [...prev.responses, response] }
        },
      )
      queryClient.invalidateQueries({ queryKey: feedbackThreadKey(feedbackId) })
    },
  })
}
