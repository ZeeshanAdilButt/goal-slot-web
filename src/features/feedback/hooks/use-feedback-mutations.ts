import { feedbackQueries } from '@/features/feedback/utils/queries'
import { ArchiveFeedbackForm, CreateFeedbackForm } from '@/features/feedback/utils/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { feedbackApi } from '@/lib/api'

export function useCreateFeedbackMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateFeedbackForm) => {
      const res = await feedbackApi.create(data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackQueries.all })
      toast.success('Thank you for your feedback!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit feedback')
    },
  })
}

export function useArchiveFeedbackMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ArchiveFeedbackForm }) => {
      const res = await feedbackApi.archive(id, data)
      return res.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: feedbackQueries.all })
      toast.success(variables.data.isArchived ? 'Feedback archived' : 'Feedback restored')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update feedback')
    },
  })
}

export function useDeleteFeedbackMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await feedbackApi.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackQueries.all })
      toast.success('Feedback deleted')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete feedback')
    },
  })
}
