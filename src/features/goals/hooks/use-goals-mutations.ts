import { goalQueries } from '@/features/goals/utils/queries'
import { CreateGoalForm, UpdateGoalForm } from '@/features/goals/utils/types'
import { labelQueries } from '@/features/labels'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { goalsApi } from '@/lib/api'

export function useCreateGoalMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateGoalForm) => {
      const res = await goalsApi.create(data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalQueries.all })
      // Also invalidate labels since new labels may have been auto-created
      queryClient.invalidateQueries({ queryKey: labelQueries.all() })
      toast.success('Goal created')
    },
    onError: (error: any) => {
      console.error('Create goal error:', error?.response?.data || error)
      toast.error(error?.response?.data?.message || 'Failed to create goal')
    },
  })
}

export function useUpdateGoalMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateGoalForm }) => {
      const res = await goalsApi.update(id, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalQueries.all })
      // Also invalidate labels since new labels may have been auto-created
      queryClient.invalidateQueries({ queryKey: labelQueries.all() })
      toast.success('Goal updated')
    },
    onError: (error: any) => {
      console.error('Update goal error:', error?.response?.data || error)
      toast.error(error?.response?.data?.message || 'Failed to update goal')
    },
  })
}

export function useDeleteGoalMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await goalsApi.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalQueries.all })
      toast.success('Goal deleted')
    },
    onError: () => {
      toast.error('Failed to delete goal')
    },
  })
}
