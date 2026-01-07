import { feedbackQueries, fetchFeedback, fetchFeedbacks } from '@/features/feedback/utils/queries'
import { FeedbackFilters } from '@/features/feedback/utils/types'
import { useQuery } from '@tanstack/react-query'

export function useFeedbacksQuery(filters?: FeedbackFilters) {
  return useQuery({
    queryKey: feedbackQueries.list(filters),
    queryFn: () => fetchFeedbacks(filters),
  })
}

export function useFeedbackQuery(id: string) {
  return useQuery({
    queryKey: feedbackQueries.detail(id),
    queryFn: () => fetchFeedback(id),
  })
}
