import { categoryQueries } from '@/features/categories/utils/queries'
import { Category, CreateCategoryForm, UpdateCategoryForm } from '@/features/categories/utils/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { categoriesApi } from '@/lib/api'

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCategoryForm) => {
      const res = await categoriesApi.create(data)
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: categoryQueries.all() })
      toast.success('Category created')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create category'
      toast.error(message)
    },
  })
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCategoryForm }) => {
      const res = await categoriesApi.update(id, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryQueries.all() })
      toast.success('Category updated')
    },
    onError: () => {
      toast.error('Failed to update category')
    },
  })
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await categoriesApi.delete(id)
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: categoryQueries.all() })
      // Also invalidate related queries that use categories
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })

      if (data.wasInUse) {
        toast.success(`Category deleted. ${data.usageCount} item(s) were updated.`, { duration: 4000 })
      } else {
        toast.success('Category deleted')
      }
    },
    onError: () => {
      toast.error('Failed to delete category')
    },
  })
}
