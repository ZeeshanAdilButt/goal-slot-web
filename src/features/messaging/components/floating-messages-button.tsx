'use client'

import { useRouter } from 'next/navigation'

import { Button1 } from '@/features/feedback/components/ui/button-1'
import { useUnreadConversationsCount } from '@/features/messaging/hooks/use-messaging-queries'
import { isMessagingConfigured } from '@/features/messaging/utils/config'
import { MessagesSquare } from 'lucide-react'

import { useAuthStore } from '@/lib/store'

/**
 * Floating Messages button, in the bottom-right dock.
 *
 * Placement: immediately left of Notifications, and deliberately not next to
 * Journal/Voice/Coach. Those three are capture actions — things you start.
 * Messages and Notifications are the opposite: things other people sent you,
 * both carrying an unread count you check rather than invoke. Grouping by
 * that distinction is what keeps a five-item dock readable instead of just
 * making it a six-item row of unrelated icons.
 *
 * Styling mirrors NotificationsButton exactly (same Button1 shell, same 8x8
 * box, same badge geometry) so the pair reads as one unit.
 *
 * Hidden when signed out or when no messaging service is configured for the
 * deployment, matching how the sidebar omits the nav entry entirely.
 */
export function FloatingMessagesButton() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()
  const unreadCount = useUnreadConversationsCount()

  if (!isMessagingConfigured) return null
  if (!isAuthenticated || isLoading) return null

  const hasUnread = unreadCount > 0

  return (
    <div className="relative">
      <Button1
        type="secondary"
        size="small"
        onClick={() => router.push('/dashboard/messages')}
        className="!h-8 !w-8 !p-0 font-medium"
        title={hasUnread ? `Messages (${unreadCount} unread)` : 'Messages'}
        aria-label={
          hasUnread
            ? `Messages, ${unreadCount} unread ${unreadCount === 1 ? 'conversation' : 'conversations'}`
            : 'Messages'
        }
      >
        <div className="relative flex items-center">
          <MessagesSquare className="h-4 w-4" />
          {hasUnread && (
            // Same red pill as Notifications: an unread message is the same
            // kind of "someone is waiting on you" signal, so it should not
            // get a different colour and read as a different severity.
            <span
              aria-hidden="true"
              className="absolute -right-1 -top-1 inline-flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </Button1>
    </div>
  )
}
