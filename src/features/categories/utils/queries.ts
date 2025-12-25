import { queryOptions } from '@tanstack/react-query'

import { categoriesApi } from '@/lib/api'

import { Category } from './types'

const baseKey = ['categories'] as const

export const categoryQueries = {
  all: () => baseKey,

  listKey: () => [...baseKey, 'list'] as const,
  detailKey: (id: string) => [...baseKey, 'detail', id] as const,

  list: () =>
    queryOptions<Category[]>({
      queryKey: categoryQueries.listKey(),
      queryFn: async (): Promise<Category[]> => {
        const res = await categoriesApi.getAll()
        return res.data
      },
    }),

  detail: (id: string) =>
    queryOptions<Category>({
      queryKey: categoryQueries.detailKey(id),
      queryFn: async (): Promise<Category> => {
        const res = await categoriesApi.getOne(id)
        return res.data
      },
    }),
} as const

export default categoryQueries
