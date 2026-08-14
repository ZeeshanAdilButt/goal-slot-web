import { Conversation, Message, MessagingPerson, ThreadMessage } from '@/features/messaging/utils/types'
import { format, isThisYear, isToday, isYesterday } from 'date-fns'

const OPTIMISTIC_PREFIX = 'optimistic_'

export const isOptimisticId = (id: string) => id.startsWith(OPTIMISTIC_PREFIX)

export const createOptimisticMessage = (conversationId: string, senderId: string, body: string): ThreadMessage => ({
  id: `${OPTIMISTIC_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  conversationId,
  senderId,
  body,
  createdAt: new Date().toISOString(),
  pending: true,
})

const toTime = (value: string | null | undefined): number => {
  if (!value) return 0
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

export const getParticipantIds = (conversation: Conversation | undefined): string[] =>
  conversation?.participants?.map((participant) => participant.userId) ?? []

export const getCounterpartIds = (
  conversation: Conversation | undefined,
  currentUserId: string | undefined,
): string[] => getParticipantIds(conversation).filter((userId) => userId !== currentUserId)

export const getLastReadAt = (conversation: Conversation | undefined, userId: string | undefined): string | null =>
  conversation?.participants?.find((participant) => participant.userId === userId)?.lastReadAt ?? null

/** Newest activity we know about, whichever field the service populated. */
export const getLastActivityAt = (conversation: Conversation): string | null =>
  conversation.lastMessage?.createdAt ??
  conversation.lastMessageAt ??
  conversation.updatedAt ??
  conversation.createdAt ??
  null

/**
 * The timestamp of the newest message the current user did not send. Prefers
 * the loaded thread (authoritative on sender) and falls back to the summary
 * fields on the conversation itself.
 */
const getLastIncomingAt = (
  conversation: Conversation,
  currentUserId: string | undefined,
  messages?: ThreadMessage[],
): string | null => {
  if (messages?.length) {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index]
      if (message.senderId !== currentUserId) return message.createdAt
    }
    return null
  }

  // The server tells us definitively once it populates lastMessage at all:
  // either a real message (compare its sender), or explicitly null meaning
  // no message has ever been sent in this conversation - nothing to be
  // unread. Checking `!== undefined` here, not truthiness, is what makes
  // that distinction; `if (conversation.lastMessage)` would treat null the
  // same as "the server didn't say," which is exactly what made a brand
  // new, message-less conversation register as unread the moment it was
  // created (its own createdAt got picked up by the fallback below as if
  // it were an incoming message).
  if (conversation.lastMessage !== undefined) {
    if (conversation.lastMessage === null) return null
    return conversation.lastMessage.senderId === currentUserId ? null : conversation.lastMessage.createdAt
  }

  // No lastMessage field at all - an older API response shape. Treat any
  // activity as potentially unread rather than silently hiding a new
  // message.
  return getLastActivityAt(conversation)
}

/**
 * Whether every other participant in the conversation has read past this
 * message already. Only meaningful for a message the current user sent -
 * used to show a "Seen" indicator under the most recent one.
 */
export const isSeenByCounterparts = (
  conversation: Conversation | undefined,
  currentUserId: string | undefined,
  message: ThreadMessage,
): boolean => {
  const counterparts = conversation?.participants?.filter((participant) => participant.userId !== currentUserId) ?? []
  if (!counterparts.length) return false

  // toTime coerces an unparsable date to 0, which would make a malformed
  // message.createdAt look "seen" by anyone with any lastReadAt at all (0
  // <= anything). Require both sides to be genuinely parsable dates first.
  const isValidDate = (value: string | null | undefined): boolean => !!value && !Number.isNaN(new Date(value).getTime())
  if (!isValidDate(message.createdAt)) return false

  const messageTime = toTime(message.createdAt)
  return counterparts.every(
    (participant) => isValidDate(participant.lastReadAt) && toTime(participant.lastReadAt) >= messageTime,
  )
}

export const hasUnreadMessages = (
  conversation: Conversation,
  currentUserId: string | undefined,
  messages?: ThreadMessage[],
): boolean => {
  const lastIncomingAt = getLastIncomingAt(conversation, currentUserId, messages)
  if (!lastIncomingAt) return false

  const lastReadAt = getLastReadAt(conversation, currentUserId)
  if (!lastReadAt) return true

  return toTime(lastIncomingAt) > toTime(lastReadAt)
}

export const sortConversationsByActivity = (conversations: Conversation[]): Conversation[] =>
  [...conversations].sort((a, b) => toTime(getLastActivityAt(b)) - toTime(getLastActivityAt(a)))

export const getConversationPreview = (conversation: Conversation): string =>
  conversation.lastMessage?.body?.trim() || 'No messages yet'

export const displayName = (person: MessagingPerson | undefined, fallbackId: string): string =>
  person?.name?.trim() || person?.email?.trim() || `Member ${fallbackId.slice(0, 6)}`

export const displayInitial = (person: MessagingPerson | undefined, fallbackId: string): string =>
  displayName(person, fallbackId).charAt(0).toUpperCase()

const safeDate = (value: string | null | undefined): Date | null => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Compact stamp for the conversation list: time today, date otherwise. */
export const formatConversationTimestamp = (value: string | null | undefined): string => {
  const date = safeDate(value)
  if (!date) return ''
  if (isToday(date)) return format(date, 'HH:mm')
  if (isYesterday(date)) return 'Yesterday'
  return format(date, isThisYear(date) ? 'd MMM' : 'd MMM yyyy')
}

/** Full stamp for a message bubble, also used as its accessible time label. */
export const formatMessageTimestamp = (value: string | null | undefined): string => {
  const date = safeDate(value)
  if (!date) return ''
  if (isToday(date)) return format(date, 'HH:mm')
  if (isYesterday(date)) return `Yesterday ${format(date, 'HH:mm')}`
  return format(date, isThisYear(date) ? 'd MMM, HH:mm' : 'd MMM yyyy, HH:mm')
}

/** Day separator label between message groups. */
export const formatDayHeading = (value: string | null | undefined): string => {
  const date = safeDate(value)
  if (!date) return ''
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, isThisYear(date) ? 'EEEE d MMMM' : 'd MMMM yyyy')
}

export const isSameDay = (a: string | null | undefined, b: string | null | undefined): boolean => {
  const first = safeDate(a)
  const second = safeDate(b)
  if (!first || !second) return false
  return format(first, 'yyyy-MM-dd') === format(second, 'yyyy-MM-dd')
}

/** Narrows an untrusted WebSocket payload to a message. */
export const parseSocketMessage = (raw: unknown): Message | null => {
  if (typeof raw !== 'string') return null

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (!parsed || typeof parsed !== 'object') return null
  const candidate = parsed as Record<string, unknown>

  const isString = (value: unknown): value is string => typeof value === 'string' && value.length > 0

  if (
    !isString(candidate.id) ||
    !isString(candidate.conversationId) ||
    !isString(candidate.senderId) ||
    typeof candidate.body !== 'string' ||
    !isString(candidate.createdAt)
  ) {
    return null
  }

  return {
    id: candidate.id,
    conversationId: candidate.conversationId,
    senderId: candidate.senderId,
    body: candidate.body,
    createdAt: candidate.createdAt,
  }
}
