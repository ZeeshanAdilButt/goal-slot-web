'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button1 } from '@/features/feedback/components/ui/button-1'
import { useFeedbackWidgetStore } from '@/features/feedback/store/use-feedback-widget-store'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsQuery,
} from '@/features/notifications/hooks/use-notifications'
import { resolveNotificationAction } from '@/features/notifications/utils/notification-routing'
import type { AppNotification, NotificationScope } from '@/features/notifications/utils/types'
import clsx from 'clsx'
import { Bell } from 'lucide-react'

import { useAuthStore } from '@/lib/store'

/**
 * The bell is the *general* feed: everything except message notifications.
 *
 * Messages are surfaced on the Messages button instead, where the unread
 * count comes from the conversation list (useUnreadConversationsCount) rather
 * than from notification rows. Keeping message notifications out of this feed
 * entirely is what stops one incoming message from being counted twice — once
 * here and once there.
 *
 * The scope is applied server-side to `unreadCount` as well as `items`, so
 * this badge can never show a number this list cannot account for. Filtering
 * client-side instead would do exactly that, and would also render pages of
 * 10 as 3 rows.
 */
const BELL_SCOPE: NotificationScope = 'general'

export const NotificationsButton = () => {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()
  const openThread = useFeedbackWidgetStore((state) => state.openThread)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isQueryLoading,
  } = useNotificationsQuery(10, { enabled: isAuthenticated, scope: BELL_SCOPE })
  const markRead = useMarkNotificationRead(BELL_SCOPE)
  const markAllRead = useMarkAllNotificationsRead(BELL_SCOPE)

  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState<React.CSSProperties>({})

  const notifications = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data])
  const unreadCount = data?.pages[0]?.unreadCount ?? 0

  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && buttonRef.current && menuRef.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect()
        const menuHeight = menuRef.current.offsetHeight
        const next: React.CSSProperties = { bottom: buttonRect.height + 8, right: 0 }
        if (buttonRect.top - menuHeight < 8) {
          next.maxHeight = `${buttonRect.top - 8}px`
          next.overflowY = 'auto'
        }
        setPosition(next)
      }
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition)
    }
  }, [isOpen])

  // Close on an outside press, but treat the bell itself as inside: the shared
  // useClickOutside hook counts the trigger as outside, so a press on the bell
  // closed the popover on mousedown and the button's own onClick immediately
  // reopened it — which is why this used to be open-only and never a toggle.
  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: Event) => {
      const target = event.target as Node | null
      if (!target) return
      if (menuRef.current?.contains(target)) return
      if (buttonRef.current?.contains(target)) return
      setIsOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [isOpen])

  const handleToggle = () => {
    if (!isAuthenticated || isLoading) return
    setIsOpen((open) => !open)
  }

  const handleNotificationClick = (item: AppNotification) => {
    if (!item) return

    // Resolve before closing so a mid-click state change cannot lose the
    // destination, and route for every type — this used to navigate only for
    // FEEDBACK_REPLY, so clicking a message notification marked it read and
    // left the user exactly where they were.
    const action = resolveNotificationAction(item)

    if (!item.readAt) {
      markRead.mutate(item.id)
    }
    setIsOpen(false)

    if (action.kind === 'navigate') {
      router.push(action.href)
    } else {
      openThread(action.feedbackId)
    }
  }

  if (!isAuthenticated || isLoading) return null

  return (
    <div className="relative">
      <Button1
        type="secondary"
        size="small"
        ref={buttonRef}
        onClick={handleToggle}
        className="!h-8 !w-8 !p-0 font-medium"
        title="Notifications"
        aria-expanded={isOpen}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      >
        <div className="relative flex items-center">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-1 -top-1 inline-flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </Button1>
      <div
        ref={menuRef}
        className={clsx(
          'absolute z-50 w-[360px] overflow-hidden rounded-lg border border-zinc-200 bg-white text-zinc-900 shadow-xl transition-opacity duration-150',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        style={{ ...position }}
      >
        <div className="flex items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-900">
          <span>Notifications</span>
          {/* Was a dead <span>{unreadCount} unread</span>. The count is already
              on the badge; the useful thing in this corner is the action. */}
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={unreadCount === 0 || markAllRead.isPending}
            className="rounded px-1.5 py-0.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-zinc-400 disabled:hover:bg-transparent"
          >
            {markAllRead.isPending ? 'Marking...' : 'Mark all read'}
          </button>
        </div>
        {markAllRead.isError && (
          <div className="border-b border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
            Could not mark all as read. Please try again.
          </div>
        )}
        <div className="max-h-[360px] overflow-y-auto bg-white">
          {isQueryLoading ? (
            <div className="px-4 py-6 text-center text-sm text-zinc-500">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-zinc-500">No notifications yet</div>
          ) : (
            notifications.map((item) => (
              <button
                key={item.id}
                className={clsx(
                  'flex w-full flex-col items-start gap-1 border-b border-zinc-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-zinc-50',
                  item.readAt ? 'bg-white' : 'bg-[#fffbea]',
                )}
                onClick={() => handleNotificationClick(item)}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  {/* Every underscore, not just the first: .replace('_', ' ')
                      rendered SHARED_REPORT_UNVIEWED as "SHARED REPORT_UNVIEWED". */}
                  {item.type.replace(/_/g, ' ')}
                </span>
                <span className="text-sm font-semibold text-zinc-900">{item.title}</span>
                {item.body && <span className="text-sm leading-relaxed text-zinc-700">{item.body}</span>}
                <span className="text-[11px] text-zinc-400">{new Date(item.createdAt).toLocaleString()}</span>
              </button>
            ))
          )}
        </div>
        {hasNextPage && (
          <div className="border-t border-zinc-200 bg-zinc-50 p-2">
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="inline-flex h-8 w-full items-center justify-center rounded-md border border-zinc-200 bg-white text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isFetchingNextPage ? 'Loading...' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
