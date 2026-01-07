import { FeedbackFilters } from '@/features/feedback/utils/types'

import { feedbackApi } from '@/lib/api'

export const feedbackQueries = {
  all: ['feedback'] as const,
  list: (filters?: FeedbackFilters) => [...feedbackQueries.all, 'list', filters] as const,
  detail: (id: string) => [...feedbackQueries.all, 'detail', id] as const,
}

export const fetchFeedbacks = async (filters?: FeedbackFilters) => {
  const res = await feedbackApi.getAll(filters)
  return res.data
}

export const fetchFeedback = async (id: string) => {
  const res = await feedbackApi.getOne(id)
  return res.data
}
