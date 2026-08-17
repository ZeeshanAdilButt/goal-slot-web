import type {
  AppNotification,
  MarkAllNotificationsReadResponse,
  NotificationListResponse,
  NotificationScope,
} from '@/features/notifications/utils/types'
import { InfiniteData, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { notificationsApi } from '@/lib/api'

const NOTIFICATIONS_KEY_ROOT = 'notifications'

/**
 * The scope is part of the key, not just the request.
 *
 * A cursor minted under one scope is meaningless under another: it points at a
 * row the other scope may not even return, so sharing a cache entry between
 * them splices mismatched pages together. Keying on the scope keeps the two
 * feeds as two caches, which is what they are.
 */
export const notificationsKey = (scope: NotificationScope) => [NOTIFICATIONS_KEY_ROOT, 'list', scope] as const

/** Prefix key, for invalidating every scope at once. */
const allNotificationsKey = [NOTIFICATIONS_KEY_ROOT] as const

type NotificationPages = InfiniteData<NotificationListResponse>

export function useNotificationsQuery(pageSize = 10, options: { enabled?: boolean; scope?: NotificationScope } = {}) {
  const scope = options.scope ?? 'all'

  return useInfiniteQuery<NotificationListResponse>({
    queryKey: notificationsKey(scope),
    queryFn: async ({ pageParam }) => {
      const res = await notificationsApi.list({
        cursor: pageParam as string | undefined,
        limit: pageSize,
        scope,
      })
      return res.data as NotificationListResponse
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: options.enabled,
  })
}

export function useMarkNotificationRead(scope: NotificationScope = 'all') {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await notificationsApi.markRead(id)
      return res.data
    },
    onSuccess: (_data, id) => {
      // Patch the cache in place rather than refetching. A plain invalidate on
      // an infinite query refetches *every* page the user has loaded, which is
      // a lot of database work to learn a single timestamp we already know.
      queryClient.setQueryData<NotificationPages>(notificationsKey(scope), (current) => markOneRead(current, id))
      // Mark the other scope stale without firing a request; it refetches on
      // its next natural read.
      queryClient.invalidateQueries({ queryKey: allNotificationsKey, refetchType: 'none' })
    },
  })
}

/**
 * Marks every unread notification in one scope read, in a single request that
 * the API serves with a single bulk UPDATE.
 *
 * The scope MUST match the scope the list was read with. Passing 'all' while
 * showing a 'general' list would clear message notifications the user never
 * saw in this feed.
 */
export function useMarkAllNotificationsRead(scope: NotificationScope = 'all') {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const res = await notificationsApi.markAllRead(scope)
      return res.data as MarkAllNotificationsReadResponse
    },
    onSuccess: () => {
      // The end state is known exactly — everything in this scope is read and
      // the count is 0 by construction — so write it rather than ask for it.
      const readAt = new Date().toISOString()
      queryClient.setQueryData<NotificationPages>(notificationsKey(scope), (current) =>
        markAllPagesRead(current, readAt),
      )
      queryClient.invalidateQueries({ queryKey: allNotificationsKey, refetchType: 'none' })
    },
  })
}

function markOneRead(current: NotificationPages | undefined, id: string): NotificationPages | undefined {
  if (!current) return current

  let didMarkUnread = false
  const markItem = (item: AppNotification): AppNotification => {
    if (item.id !== id || item.readAt) return item
    didMarkUnread = true
    return { ...item, readAt: new Date().toISOString() }
  }

  const pages = current.pages.map((page) => ({ ...page, items: page.items.map(markItem) }))
  if (!didMarkUnread) return current

  // unreadCount is repeated on every page, so it has to be decremented on
  // every page or a later page's stale copy can resurrect the old badge.
  return {
    ...current,
    pages: pages.map((page) => ({ ...page, unreadCount: Math.max(0, page.unreadCount - 1) })),
  }
}

function markAllPagesRead(current: NotificationPages | undefined, readAt: string): NotificationPages | undefined {
  if (!current) return current

  return {
    ...current,
    pages: current.pages.map((page) => ({
      ...page,
      unreadCount: 0,
      items: page.items.map((item) => (item.readAt ? item : { ...item, readAt })),
    })),
  }
}
