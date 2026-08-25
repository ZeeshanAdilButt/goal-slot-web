'use client'

import { useMessagingTokenQuery } from '@/features/messaging/hooks/use-messaging-token'
import {
  applyMessageToConversationList,
  markConversationReadInCache,
  removeMessageFromCache,
  replaceOptimisticMessage,
  upsertMessageInCache,
} from '@/features/messaging/utils/cache'
import { MessagingApiError, messagingErrorMessage } from '@/features/messaging/utils/client'
import { rememberPeople } from '@/features/messaging/utils/directory'
import { createOptimisticMessage } from '@/features/messaging/utils/helpers'
import {
  createConversationWith,
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
 * Opens (or reuses) the conversation with someone the user already shares
 * with. GoalSlot owns the permission check, so a 403 here means the sharing
 * relationship is gone.
 */
export function useStartConversationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => createConversationWith(userId),
    onSuccess: (opened) => {
      // The only response on the messaging surface that carries a name for
      // a participant, rather than a bare user id. Keep it: it is what puts
      // a name on this thread if the share behind it is ever revoked.
      rememberPeople(queryClient, [opened.counterpart])
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
