import { categoryQueries } from '@/features/categories/utils/queries'
import { useQuery } from '@tanstack/react-query'

export function useCategoriesQuery() {
  return useQuery(categoryQueries.list())
}

export function useCategoryQuery(id: string) {
  return useQuery(categoryQueries.detail(id))
}
