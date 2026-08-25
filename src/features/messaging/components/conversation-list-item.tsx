import {
  displayInitial,
  displayName,
  formatConversationTimestamp,
  getConversationPreview,
  getCounterpartIds,
  getLastActivityAt,
} from '@/features/messaging/utils/helpers'
import { Conversation, MessagingPerson } from '@/features/messaging/utils/types'

import { cn } from '@/lib/utils'

interface ConversationListItemProps {
  conversation: Conversation
  currentUserId: string | undefined
  directory: Map<string, MessagingPerson>
  isSelected: boolean
  isUnread: boolean
  onSelect: () => void
}

export function ConversationListItem({
  conversation,
  currentUserId,
  directory,
  isSelected,
  isUnread,
  onSelect,
}: ConversationListItemProps) {
  const counterpartIds = getCounterpartIds(conversation, currentUserId)
  const primaryId = counterpartIds[0]
  const person = primaryId ? directory.get(primaryId) : undefined

  const name = counterpartIds.length
    ? counterpartIds.map((userId) => displayName(directory.get(userId))).join(', ')
    : 'Conversation'
  const preview = getConversationPreview(conversation)
  const timestamp = formatConversationTimestamp(getLastActivityAt(conversation))

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={isSelected ? 'true' : undefined}
        aria-label={`${name}${isUnread ? ', unread' : ''}. ${preview}`}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2cc0d] focus-visible:ring-offset-1',
          isSelected
            ? 'border-[#f2cc0d]/50 bg-[#fffbea]'
            : 'border-transparent bg-white hover:border-zinc-200 hover:bg-zinc-50',
        )}
      >
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-sm font-bold text-zinc-700"
        >
          {primaryId ? displayInitial(person) : '?'}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span
              className={cn('truncate text-sm', isUnread ? 'font-bold text-zinc-900' : 'font-medium text-zinc-800')}
            >
              {name}
            </span>
            {timestamp && <span className="shrink-0 text-[10px] text-zinc-400">{timestamp}</span>}
          </span>
          <span className={cn('mt-0.5 block truncate text-xs', isUnread ? 'text-zinc-700' : 'text-zinc-500')}>
            {preview}
          </span>
        </span>

        {isUnread && (
          <span
            aria-hidden="true"
            className="h-2 w-2 shrink-0 rounded-full bg-[#f2cc0d] ring-2 ring-[#f2cc0d]/25"
            title="Unread messages"
          />
        )}
      </button>
    </li>
  )
}
