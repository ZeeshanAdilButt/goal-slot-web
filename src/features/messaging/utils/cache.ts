import { isDeletedMessage } from '@/features/messaging/utils/helpers'
import { messagingQueries } from '@/features/messaging/utils/queries'
import { Conversation, Message, ThreadMessage } from '@/features/messaging/utils/types'
import type { QueryClient } from '@tanstack/react-query'

/**
 * Reconciling a delivered message into the cache, shared by the WebSocket
 * (someone else's message, or our own echoed back from another tab) and by
 * the send mutation (our own, replacing its optimistic row).
 *
 * Deliberately never seeds a thread the user has not opened: writing a
 * single-message array into an empty cache would make the thread render as if
 * that were the whole history.
 */
export function upsertMessageInCache(queryClient: QueryClient, message: Message): void {
  queryClient.setQueryData<ThreadMessage[]>(messagingQueries.messages(message.conversationId), (existing) => {
    if (!existing) return existing

    const index = existing.findIndex((candidate) => candidate.id === message.id)
    if (index >= 0) {
      // Already on screen. The one thing that legitimately arrives twice for
      // the same id is a deletion: the service pushes the tombstone over the
      // same socket, so it has to replace the row rather than be discarded as
      // a duplicate. Anything else is genuinely a duplicate and is ignored.
      if (!isDeletedMessage(message)) return existing
      const next = [...existing]
      next[index] = message
      return next
    }

    // Our own send may already be on screen as an optimistic row; swap it in
    // place so the bubble does not jump or duplicate.
    const optimisticIndex = existing.findIndex(
      (candidate) => candidate.pending && candidate.senderId === message.senderId && candidate.body === message.body,
    )

    if (optimisticIndex >= 0) {
      const next = [...existing]
      next[optimisticIndex] = message
      return next
    }

    return [...existing, message]
  })
}

/**
 * Swaps our optimistic row for the row the server acknowledged. The socket can
 * echo our own message back before or after the POST resolves, so all three
 * orderings have to land on exactly one copy of the message.
 */
export function replaceOptimisticMessage(queryClient: QueryClient, optimisticId: string, message: Message): void {
  queryClient.setQueryData<ThreadMessage[]>(messagingQueries.messages(message.conversationId), (existing) => {
    if (!existing) return existing

    const alreadyDelivered = existing.some((candidate) => candidate.id === message.id)
    const optimisticIndex = existing.findIndex((candidate) => candidate.id === optimisticId)

    // The socket got here first and already consumed the optimistic row, or
    // left it behind as a twin; either way the real message is on screen.
    if (alreadyDelivered) {
      return optimisticIndex === -1 ? existing : existing.filter((candidate) => candidate.id !== optimisticId)
    }

    // Nothing to replace (the thread reloaded mid-flight): append instead of
    // dropping the message the user just sent.
    if (optimisticIndex === -1) return [...existing, message]

    const next = [...existing]
    next[optimisticIndex] = message
    return next
  })
}

/**
 * Folds a message deletion into everywhere the message is shown: the thread
 * itself, and the conversation list's preview when the deleted message was
 * the one being previewed.
 *
 * The list is patched by id rather than refetched so a deletion does not
 * reorder the list - `lastMessageAt` and `updatedAt` are deliberately left
 * alone, because deleting an old message is not new activity.
 */
export function applyMessageDeletionToCaches(queryClient: QueryClient, message: Message): void {
  upsertMessageInCache(queryClient, message)

  queryClient.setQueryData<Conversation[]>(messagingQueries.conversations(), (existing) => {
    if (!existing) return existing

    const index = existing.findIndex((conversation) => conversation.id === message.conversationId)
    if (index === -1) return existing
    if (existing[index].lastMessage?.id !== message.id) return existing

    const next = [...existing]
    next[index] = { ...next[index], lastMessage: message }
    return next
  })
}

/**
 * Drops a conversation the user deleted for themselves out of the cached
 * list, along with the thread and conversation entries behind it.
 *
 * Removing the per-conversation caches matters as much as the list: the
 * service now hides that history from this user, so leaving a stale copy in
 * the cache would keep rendering messages a refetch would no longer return.
 */
export function removeConversationFromCache(queryClient: QueryClient, conversationId: string): void {
  queryClient.setQueryData<Conversation[]>(messagingQueries.conversations(), (existing) =>
    existing ? existing.filter((conversation) => conversation.id !== conversationId) : existing,
  )
  queryClient.removeQueries({ queryKey: messagingQueries.conversation(conversationId) })
  queryClient.removeQueries({ queryKey: messagingQueries.messages(conversationId) })
}

export function removeMessageFromCache(queryClient: QueryClient, conversationId: string, messageId: string): void {
  queryClient.setQueryData<ThreadMessage[]>(messagingQueries.messages(conversationId), (existing) =>
    existing ? existing.filter((candidate) => candidate.id !== messageId) : existing,
  )
}

/**
 * Moves a conversation to the top of the list with a fresh preview. When the
 * conversation is not in the cached list at all (a first message from someone
 * new), falls back to a refetch so the list can pick it up.
 */
export function applyMessageToConversationList(queryClient: QueryClient, message: Message): void {
  let matched = false

  queryClient.setQueryData<Conversation[]>(messagingQueries.conversations(), (existing) => {
    if (!existing) return existing

    const index = existing.findIndex((conversation) => conversation.id === message.conversationId)
    if (index === -1) return existing

    matched = true
    const next = [...existing]
    next[index] = {
      ...next[index],
      lastMessage: message,
      lastMessageAt: message.createdAt,
      updatedAt: message.createdAt,
    }
    return next
  })

  if (!matched) {
    void queryClient.invalidateQueries({ queryKey: messagingQueries.conversations() })
  }
}

/** Optimistically advances the current user's read marker. */
export function markConversationReadInCache(
  queryClient: QueryClient,
  conversationId: string,
  userId: string,
  readAt: string,
): void {
  const advance = (conversation: Conversation): Conversation => {
    if (!conversation.participants) return conversation
    return {
      ...conversation,
      participants: conversation.participants.map((participant) =>
        participant.userId === userId ? { ...participant, lastReadAt: readAt } : participant,
      ),
    }
  }

  queryClient.setQueryData<Conversation>(messagingQueries.conversation(conversationId), (existing) =>
    existing ? advance(existing) : existing,
  )

  queryClient.setQueryData<Conversation[]>(messagingQueries.conversations(), (existing) =>
    existing
      ? existing.map((conversation) => (conversation.id === conversationId ? advance(conversation) : conversation))
      : existing,
  )
}

/**
 * After a dropped socket reconnects we may have missed messages, so the lists
 * and any loaded thread are refetched. The token query is left alone: it is
 * still valid and refetching it would churn the socket.
 */
export function resyncMessagingCaches(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: messagingQueries.conversations() })
  void queryClient.invalidateQueries({ queryKey: messagingQueries.conversationRoot() })
  void queryClient.invalidateQueries({ queryKey: messagingQueries.messagesRoot() })
}
