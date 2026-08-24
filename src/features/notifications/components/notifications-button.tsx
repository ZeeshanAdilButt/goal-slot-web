'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button1 } from '@/features/feedback/components/ui/button-1'
import { Material } from '@/features/feedback/components/ui/material-1'
import { useFeedbackWidgetStore } from '@/features/feedback/store/use-feedback-widget-store'
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsQuery,
} from '@/features/notifications/hooks/use-notifications'
import { resolveNotificationAction } from '@/features/notifications/utils/notification-routing'
import clsx from 'clsx'
import { Bell, X } from 'lucide-react'

import { useAuthStore } from '@/lib/store'
import { useClickOutside } from '@/hooks/use-click-outside'
import { ConfirmDialog } from '@/components/confirm-dialog'

export const NotificationsButton = () => {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()
  const openThread = useFeedbackWidgetStore((state) => state.openThread)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading: isQueryLoading } =
    useNotificationsQuery(10, { enabled: isAuthenticated })
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const deleteNotification = useDeleteNotification()

  const [isOpen, setIsOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
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

  useClickOutside(menuRef, () => setIsOpen(false))

  const handleOpen = () => {
    if (!isAuthenticated || isLoading) return
    setIsOpen(true)
  }

  const handleNotificationClick = async (item: any) => {
    if (!item) return
    if (!item.readAt) {
      markRead.mutate(item.id)
    }

    // Previously this only handled FEEDBACK_REPLY, so clicking any of the
    // other four notification types just closed the popover and left the user
    // wherever they already were - the click looked broken because nothing
    // happened. resolveNotificationAction covers every type, and is the same
    // resolver the service worker uses for push clicks, so an in-app click and
    // a push notification for the same event now land in the same place.
    const action = resolveNotificationAction(item)
    setIsOpen(false)

    if (action.kind === 'open-feedback-thread') {
      openThread(action.feedbackId)
      return
    }
    router.push(action.href)
  }

  const handleMarkAllRead = () => {
    if (unreadCount === 0 || markAllRead.isPending) return
    markAllRead.mutate()
  }

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setPendingDeleteId(id)
  }

  const confirmDelete = () => {
    if (pendingDeleteId) {
      deleteNotification.mutate(pendingDeleteId)
    }
  }

  if (!isAuthenticated || isLoading) return null

  return (
    <div className="relative">
      <Button1
        type="secondary"
        size="small"
        ref={buttonRef}
        onClick={handleOpen}
        className="!h-8 !w-8 !p-0 font-medium"
        title="Notifications"
      >
        <div className="relative flex items-center">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
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
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-900">
          <span>Notifications</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-normal text-zinc-500">{unreadCount} unread</span>
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || markAllRead.isPending}
              className="text-xs font-medium text-blue-600 transition-colors hover:text-blue-700 disabled:cursor-not-allowed disabled:text-zinc-300"
            >
              Mark all read
            </button>
          </div>
        </div>
        <div className="max-h-[360px] overflow-y-auto bg-white">
          {isQueryLoading ? (
            <div className="px-4 py-6 text-center text-sm text-zinc-500">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-zinc-500">No notifications yet</div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={clsx(
                  'group relative flex w-full items-start border-b border-zinc-100 text-left transition-colors last:border-b-0 hover:bg-zinc-50',
                  item.readAt ? 'bg-white' : 'bg-[#fffbea]',
                )}
              >
                <button
                  className="flex min-w-0 flex-1 flex-col items-start gap-1 px-4 py-3 text-left"
                  onClick={() => handleNotificationClick(item)}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    {item.type.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-semibold text-zinc-900">{item.title}</span>
                  {item.body && <span className="text-sm leading-relaxed text-zinc-700">{item.body}</span>}
                  <span className="text-[11px] text-zinc-400">{new Date(item.createdAt).toLocaleString()}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDeleteClick(e, item.id)}
                  title="Delete notification"
                  className="mr-2 mt-3 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-200 hover:text-zinc-700 focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
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
      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null)
        }}
        title="Delete Notification"
        description="Are you sure you want to delete this notification? This action cannot be undone."
        onConfirm={confirmDelete}
        confirmButtonText="Delete"
        variant="destructive"
        isLoading={deleteNotification.isPending}
      />
    </div>
  )
}
