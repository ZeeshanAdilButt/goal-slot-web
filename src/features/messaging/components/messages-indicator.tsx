'use client'

import Link from 'next/link'

import { useUnreadConversationsCount } from '@/features/messaging/hooks/use-messaging-queries'
import { isMessagingConfigured } from '@/features/messaging/utils/config'
import { MessagesSquare } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Always-visible Messages entry point for the top bar.
 *
 * The sidebar nav item carries the same count, but the sidebar scrolls and
 * Messages sits far enough down the list to be below the fold on a laptop —
 * so a new message could arrive with nothing on screen to say so. This puts
 * the signal somewhere that is always visible, on every dashboard page.
 *
 * Renders nothing when no messaging service is configured for the
 * deployment, matching how the sidebar omits the nav item entirely.
 */
export function MessagesIndicator({ className }: { className?: string }) {
  const unreadCount = useUnreadConversationsCount()

  if (!isMessagingConfigured) return null

  const hasUnread = unreadCount > 0

  return (
    <Link
      href="/dashboard/messages"
      title={hasUnread ? `Messages (${unreadCount} unread)` : 'Messages'}
      aria-label={
        hasUnread
          ? `Messages, ${unreadCount} unread ${unreadCount === 1 ? 'conversation' : 'conversations'}`
          : 'Messages'
      }
      className={cn(
        'relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900',
        className,
      )}
    >
      <MessagesSquare className="h-4 w-4" />
      {hasUnread && (
        // Count rather than a bare dot: "3 waiting" and "1 waiting" are
        // different enough decisions to be worth the extra glyphs. The
        // badge is aria-hidden because the link's own label already says
        // it, so a screen reader doesn't read the number twice.
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f2cc0d] px-1 text-[10px] font-bold leading-none text-zinc-900 ring-2 ring-white"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
