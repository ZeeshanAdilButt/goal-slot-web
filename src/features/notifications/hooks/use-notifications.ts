import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/lib/api'
import type { NotificationListResponse } from '@/features/notifications/utils/types'

const notificationsKey = ['notifications'] as const

export function useNotificationsQuery(pageSize = 10, options: { enabled?: boolean } = {}) {
  return useInfiniteQuery<NotificationListResponse>({
    queryKey: notificationsKey,
    queryFn: async ({ pageParam }) => {
      const res = await notificationsApi.list({ cursor: pageParam as string | undefined, limit: pageSize })
      return res.data as NotificationListResponse
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: options.enabled,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await notificationsApi.markRead(id)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKey })
    },
  })
}
