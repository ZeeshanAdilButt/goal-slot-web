import { formatMessageTimestamp } from '@/features/messaging/utils/helpers'
import { ThreadMessage } from '@/features/messaging/utils/types'

import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  message: ThreadMessage
  isOwn: boolean
  senderName: string
  /** Only passed for the current user's most recent message. */
  isSeen?: boolean
}

export function MessageBubble({ message, isOwn, senderName, isSeen }: MessageBubbleProps) {
  const timestamp = formatMessageTimestamp(message.createdAt)

  return (
    <li className={cn('flex flex-col gap-1', isOwn ? 'items-end' : 'items-start')}>
      <div className="flex items-baseline gap-2 px-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
          {isOwn ? 'You' : senderName}
        </span>
        {timestamp && (
          <time dateTime={message.createdAt} className="text-[10px] text-zinc-400">
            {timestamp}
          </time>
        )}
      </div>

      <div
        className={cn(
          'max-w-[85%] whitespace-pre-wrap break-words rounded-xl border px-3 py-2 text-sm sm:max-w-[70%]',
          isOwn ? 'border-[#f2cc0d]/40 bg-[#fffbea] text-zinc-900' : 'border-zinc-200 bg-white text-zinc-800',
          message.pending && 'opacity-60',
        )}
      >
        {message.body}
      </div>

      {message.pending && (
        <span className="px-1 text-[10px] text-zinc-400">
          Sending<span className="sr-only">, not delivered yet</span>...
        </span>
      )}

      {isOwn && !message.pending && isSeen && <span className="px-1 text-[10px] text-zinc-400">Seen</span>}
    </li>
  )
}
