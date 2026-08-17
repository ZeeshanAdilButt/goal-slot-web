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
      // Previously `staleTime: 0` + refetch on every mount and window focus,
      // so that a backend backfill of new seeded categories (Spiritual +
      // Community) appeared without a hard page reload. That backfill has
      // long since shipped, and the setting was costing a request on every
      // single navigation to any of the many screens that read this list.
      //
      // Five minutes keeps the "shows up on its own" property (a newly seeded
      // category still appears within a few minutes, no reload needed) while
      // letting one fetch serve a whole burst of navigation. The user's own
      // edits are unaffected either way: every category mutation invalidates
      // this key, which refetches regardless of staleTime.
      staleTime: 5 * 60 * 1000,
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
