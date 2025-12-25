import { queryOptions } from '@tanstack/react-query'

import { labelsApi } from '@/lib/api'

import { Label } from './types'

const baseKey = ['labels'] as const

export const labelQueries = {
  all: () => baseKey,

  listKey: () => [...baseKey, 'list'] as const,
  detailKey: (id: string) => [...baseKey, 'detail', id] as const,

  list: () =>
    queryOptions<Label[]>({
      queryKey: labelQueries.listKey(),
      queryFn: async (): Promise<Label[]> => {
        const res = await labelsApi.getAll()
        return res.data
      },
    }),

  detail: (id: string) =>
    queryOptions<Label>({
      queryKey: labelQueries.detailKey(id),
      queryFn: async (): Promise<Label> => {
        const res = await labelsApi.getOne(id)
        return res.data
      },
    }),
} as const

export default labelQueries
