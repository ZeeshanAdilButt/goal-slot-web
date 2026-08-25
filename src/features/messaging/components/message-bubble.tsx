import { DELETED_MESSAGE_TEXT, formatMessageTimestamp, isDeletedMessage } from '@/features/messaging/utils/helpers'
import { ThreadMessage } from '@/features/messaging/utils/types'
import { Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  message: ThreadMessage
  isOwn: boolean
  senderName: string
  /** Only passed for the current user's most recent message. */
  isSeen?: boolean
  /**
   * Omitted where deleting is not offered at all (offline, or messaging
   * unavailable). Only ever called for the current user's own messages: the
   * service allows nobody else to delete one, so offering it would be a
   * button that always fails.
   */
  onDelete?: (messageId: string) => void
}

export function MessageBubble({ message, isOwn, senderName, isSeen, onDelete }: MessageBubbleProps) {
  const timestamp = formatMessageTimestamp(message.createdAt)
  const isDeleted = isDeletedMessage(message)
  // A message still on its way to the server has no server id to delete, and
  // a deleted one has nothing left to delete.
  const canDelete = !!onDelete && isOwn && !isDeleted && !message.pending

  return (
    <li className={cn('group flex flex-col gap-1', isOwn ? 'items-end' : 'items-start')}>
      <div className="flex items-baseline gap-2 px-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
          {isOwn ? 'You' : senderName}
        </span>
        {timestamp && (
          <time dateTime={message.createdAt} className="text-[10px] text-zinc-400">
            {timestamp}
          </time>
        )}
        {canDelete && (
          // Always in the DOM rather than mounted on hover, so it is
          // reachable by keyboard and by a screen reader; only its opacity
          // is conditional. focus-visible keeps it on screen once tabbed to.
          <button
            type="button"
            onClick={() => onDelete?.(message.id)}
            aria-label={`Delete your message sent ${timestamp || 'earlier'}`}
            className={cn(
              'rounded p-0.5 text-zinc-400 opacity-0 transition-opacity hover:text-rose-600',
              'focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2cc0d]',
              'group-hover:opacity-100',
            )}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

      <div
        className={cn(
          'max-w-[85%] whitespace-pre-wrap break-words rounded-xl border px-3 py-2 text-sm sm:max-w-[70%]',
          isDeleted
            ? 'border-dashed border-zinc-200 bg-transparent italic text-zinc-400'
            : isOwn
              ? 'border-[#f2cc0d]/40 bg-[#fffbea] text-zinc-900'
              : 'border-zinc-200 bg-white text-zinc-800',
          message.pending && 'opacity-60',
        )}
      >
        {isDeleted ? DELETED_MESSAGE_TEXT : message.body}
      </div>

      {message.pending && (
        <span className="px-1 text-[10px] text-zinc-400">
          Sending<span className="sr-only">, not delivered yet</span>...
        </span>
      )}

      {/* A deleted message has nothing left worth reporting a read receipt
          on, and "Seen" under a tombstone reads as if it were still there. */}
      {isOwn && !message.pending && !isDeleted && isSeen && (
        <span className="px-1 text-[10px] text-zinc-400">Seen</span>
      )}
    </li>
  )
}
