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
      // Refetch on every mount + window focus so newly seeded categories
      // (e.g. backend backfill of Spiritual + Community) show up without
      // a hard page reload.
      staleTime: 0,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
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
