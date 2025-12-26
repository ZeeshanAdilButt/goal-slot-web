import { labelQueries } from '@/features/labels/utils/queries'
import { CreateLabelForm, UpdateLabelForm } from '@/features/labels/utils/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { labelsApi } from '@/lib/api'

export function useCreateLabelMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateLabelForm) => {
      const res = await labelsApi.create(data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labelQueries.all() })
      toast.success('Label created')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create label'
      toast.error(message)
    },
  })
}

export function useUpdateLabelMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateLabelForm }) => {
      const res = await labelsApi.update(id, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labelQueries.all() })
      toast.success('Label updated')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update label'
      toast.error(message)
    },
  })
}

export function useDeleteLabelMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await labelsApi.delete(id)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labelQueries.all() })
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      toast.success('Label deleted')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete label'
      toast.error(message)
    },
  })
}
