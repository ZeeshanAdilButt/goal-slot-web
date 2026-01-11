import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { feedbackApi } from '@/lib/api'
import type { FeedbackThreadResponse } from '@/features/feedback/utils/types'

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
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackThreadKey(feedbackId) })
    },
  })
}
