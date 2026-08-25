'use client'

import { useMessagingTokenQuery } from '@/features/messaging/hooks/use-messaging-token'
import {
  applyMessageDeletionToCaches,
  applyMessageToConversationList,
  markConversationReadInCache,
  removeConversationFromCache,
  removeMessageFromCache,
  replaceOptimisticMessage,
  upsertMessageInCache,
} from '@/features/messaging/utils/cache'
import { MessagingApiError, messagingErrorMessage } from '@/features/messaging/utils/client'
import { createOptimisticMessage } from '@/features/messaging/utils/helpers'
import {
  createConversationWith,
  deleteConversation,
  deleteMessage,
  messagingQueries,
  postConversationRead,
  postMessage,
} from '@/features/messaging/utils/queries'
import { Message, ThreadMessage } from '@/features/messaging/utils/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { useAuthStore } from '@/lib/store'

interface SendMessageContext {
  optimistic: ThreadMessage
  hadThreadCache: boolean
}

/**
 * Optimistic send. The bubble appears immediately as `pending`, is swapped for
 * the server row on success, and is pulled back out on failure so the composer
 * can hand the text back to the user.
 */
export function useSendMessageMutation(conversationId: string | null) {
  const queryClient = useQueryClient()
  const tokenQuery = useMessagingTokenQuery()
  const currentUserId = useAuthStore((state) => state.user?.id)

  return useMutation<Message, unknown, string, SendMessageContext>({
    mutationFn: async (body: string) => {
      if (!conversationId) throw new Error('No conversation is open.')
      if (!tokenQuery.data) throw new MessagingApiError(401, 'Still connecting to messaging. Try again in a moment.')
      return postMessage(tokenQuery.data, conversationId, body)
    },
    onMutate: async (body) => {
      const optimistic = createOptimisticMessage(conversationId ?? '', currentUserId ?? 'me', body)
      if (!conversationId) return { optimistic, hadThreadCache: false }

      const queryKey = messagingQueries.messages(conversationId)
      await queryClient.cancelQueries({ queryKey })

      const existing = queryClient.getQueryData<ThreadMessage[]>(queryKey)
      // Only paint the optimistic bubble into a thread that is actually
      // loaded; seeding an empty cache would hide the real history.
      if (existing) queryClient.setQueryData<ThreadMessage[]>(queryKey, [...existing, optimistic])

      return { optimistic, hadThreadCache: !!existing }
    },
    onSuccess: (message, _body, context) => {
      if (context?.hadThreadCache) {
        replaceOptimisticMessage(queryClient, context.optimistic.id, message)
      } else {
        upsertMessageInCache(queryClient, message)
      }
      applyMessageToConversationList(queryClient, message)
    },
    onError: (error, _body, context) => {
      if (conversationId && context?.optimistic) {
        removeMessageFromCache(queryClient, conversationId, context.optimistic.id)
      }
      toast.error(messagingErrorMessage(error))
    },
  })
}

/**
 * Marks the open thread read. Advances the local read marker first so the
 * unread dot clears instantly, and rolls it back by refetching if the call
 * fails, since read state is cheap to get wrong and cheap to re-read.
 */
export function useMarkConversationReadMutation() {
  const queryClient = useQueryClient()
  const tokenQuery = useMessagingTokenQuery()
  const currentUserId = useAuthStore((state) => state.user?.id)

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (!tokenQuery.data) throw new MessagingApiError(401, 'Not connected to messaging yet.')
      await postConversationRead(tokenQuery.data, conversationId)
    },
    onMutate: (conversationId) => {
      if (currentUserId) {
        markConversationReadInCache(queryClient, conversationId, currentUserId, new Date().toISOString())
      }
    },
    onError: (_error, conversationId) => {
      // Read state is server-owned; pull the truth back rather than guessing.
      void queryClient.invalidateQueries({ queryKey: messagingQueries.conversation(conversationId) })
      void queryClient.invalidateQueries({ queryKey: messagingQueries.conversations() })
    },
  })
}

/**
 * Deletes one of the user's own messages for everyone in the conversation.
 *
 * Not optimistic. A tombstone is not a local edit: the server decides
 * whether the caller is allowed to delete this at all (only the sender is,
 * enforced there rather than by hiding the button), and it owns the
 * `deletedAt` that every client renders from. Painting the tombstone before
 * the response would have to be unpainted on a 403, which is exactly the
 * case that matters.
 */
export function useDeleteMessageMutation(conversationId: string | null) {
  const queryClient = useQueryClient()
  const tokenQuery = useMessagingTokenQuery()

  return useMutation<Message, unknown, string>({
    mutationFn: async (messageId: string) => {
      if (!conversationId) throw new Error('No conversation is open.')
      if (!tokenQuery.data) throw new MessagingApiError(401, 'Still connecting to messaging. Try again in a moment.')
      return deleteMessage(tokenQuery.data, conversationId, messageId)
    },
    onSuccess: (message) => {
      applyMessageDeletionToCaches(queryClient, message)
    },
    onError: (error) => {
      toast.error(messagingErrorMessage(error))
    },
  })
}

/**
 * Deletes a conversation for the signed-in user only.
 *
 * The other participant keeps theirs untouched, and anything they send
 * afterwards brings this one back with only the new messages - which is why
 * this drops the cached copies outright rather than trying to keep them in
 * sync with a thread the server will no longer return.
 */
export function useDeleteConversationMutation() {
  const queryClient = useQueryClient()
  const tokenQuery = useMessagingTokenQuery()

  return useMutation<void, unknown, string>({
    mutationFn: async (conversationId: string) => {
      if (!tokenQuery.data) throw new MessagingApiError(401, 'Still connecting to messaging. Try again in a moment.')
      await deleteConversation(tokenQuery.data, conversationId)
    },
    onSuccess: (_result, conversationId) => {
      removeConversationFromCache(queryClient, conversationId)
      toast.success('Conversation deleted')
    },
    onError: (error) => {
      toast.error(messagingErrorMessage(error))
    },
  })
}

/**
 * Opens (or reuses) the conversation with someone the user already shares
 * with. GoalSlot owns the permission check, so a 403 here means the sharing
 * relationship is gone.
 */
export function useStartConversationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => createConversationWith(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: messagingQueries.conversations() })
    },
    onError: (error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status === 403) {
        toast.error('You can only message people you share with.')
        return
      }
      const apiMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(apiMessage || 'Could not start that conversation.')
    },
  })
}
