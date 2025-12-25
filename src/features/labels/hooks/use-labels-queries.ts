import { useQuery } from '@tanstack/react-query'

import { labelQueries } from '@/features/labels/utils/queries'

export function useLabelsQuery() {
  return useQuery(labelQueries.list())
}

export function useLabelQuery(id: string) {
  return useQuery(labelQueries.detail(id))
}
