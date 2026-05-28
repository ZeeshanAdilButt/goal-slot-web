'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { Button1 } from '@/features/feedback/components/ui/button-1'
import { Material } from '@/features/feedback/components/ui/material-1'
import { useFeedbackWidgetStore } from '@/features/feedback/store/use-feedback-widget-store'
import { useMarkNotificationRead, useNotificationsQuery } from '@/features/notifications/hooks/use-notifications'
import clsx from 'clsx'
import { Bell } from 'lucide-react'

import { useAuthStore } from '@/lib/store'
import { useClickOutside } from '@/hooks/use-click-outside'

export const NotificationsButton = () => {
  const { isAuthenticated, isLoading } = useAuthStore()
  const openThread = useFeedbackWidgetStore((state) => state.openThread)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading: isQueryLoading } =
    useNotificationsQuery(10, { enabled: isAuthenticated })
  const markRead = useMarkNotificationRead()

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
    if (item.type === 'FEEDBACK_REPLY' && item.data?.feedbackId) {
      openThread(item.data.feedbackId)
    }
    setIsOpen(false)
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
          <span className="text-xs font-normal text-zinc-500">{unreadCount} unread</span>
        </div>
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
                  {item.type.replace('_', ' ')}
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
