'use client'

import { useMemo } from 'react'

import { useMessagingTokenQuery } from '@/features/messaging/hooks/use-messaging-token'
import { isMessagingConfigured } from '@/features/messaging/utils/config'
import { hasUnreadMessages } from '@/features/messaging/utils/helpers'
import {
  fetchConversation,
  fetchConversations,
  fetchMessages,
  messagingQueries,
} from '@/features/messaging/utils/queries'
import { Conversation, MessagingPerson, ThreadMessage } from '@/features/messaging/utils/types'
import { useMySharesQuery, useSharedWithMeQuery } from '@/features/sharing/hooks/use-sharing-queries'
import { DataShare, SharedWithMeUser } from '@/features/sharing/utils/types'
import { useQuery } from '@tanstack/react-query'

import { useAuthStore } from '@/lib/store'

export function useConversationsQuery(options?: { refetchInterval?: number }) {
  const tokenQuery = useMessagingTokenQuery()
  const token = tokenQuery.data

  return useQuery({
    queryKey: messagingQueries.conversations(),
    queryFn: () => fetchConversations(token as string),
    enabled: isMessagingConfigured && !!token,
    refetchInterval: options?.refetchInterval,
  })
}

/**
 * Total unread conversations, for a badge outside the Messages page itself
 * (the sidebar nav item). Polls independently of whatever else is reading
 * this same query - WebSocket-driven live updates only reach a client
 * that already has the conversation list mounted and connected, which a
 * user who never opens the Messages page never does.
 */
export function useUnreadConversationsCount(): number {
  const currentUserId = useAuthStore((state) => state.user?.id)
  const conversationsQuery = useConversationsQuery({ refetchInterval: 30_000 })

  return useMemo(() => {
    if (!conversationsQuery.data) return 0
    return conversationsQuery.data.filter((conversation) => hasUnreadMessages(conversation, currentUserId)).length
  }, [conversationsQuery.data, currentUserId])
}

export function useConversationQuery(conversationId: string | null, options?: { refetchInterval?: number }) {
  const tokenQuery = useMessagingTokenQuery()
  const token = tokenQuery.data

  return useQuery({
    queryKey: messagingQueries.conversation(conversationId ?? ''),
    queryFn: () => fetchConversation(token as string, conversationId as string),
    enabled: isMessagingConfigured && !!token && !!conversationId,
    refetchInterval: options?.refetchInterval,
  })
}

export function useMessagesQuery(conversationId: string | null) {
  const tokenQuery = useMessagingTokenQuery()
  const token = tokenQuery.data

  return useQuery<ThreadMessage[]>({
    queryKey: messagingQueries.messages(conversationId ?? ''),
    queryFn: () => fetchMessages(token as string, conversationId as string),
    enabled: isMessagingConfigured && !!token && !!conversationId,
  })
}

/**
 * jiffy-messaging only knows participants by user id. Names come from the
 * sharing graph, which is exactly the set of people a user is allowed to
 * message, so both directions of it are folded into one lookup.
 */
export function useMessagingDirectory(): Map<string, MessagingPerson> {
  const mySharesQuery = useMySharesQuery()
  const sharedWithMeQuery = useSharedWithMeQuery()

  const myShares = mySharesQuery.data
  const sharedWithMe = sharedWithMeQuery.data

  return useMemo(() => {
    const directory = new Map<string, MessagingPerson>()

    const add = (person: MessagingPerson | undefined) => {
      if (!person?.id) return
      const existing = directory.get(person.id)
      directory.set(person.id, {
        id: person.id,
        name: person.name || existing?.name,
        email: person.email || existing?.email,
        avatar: person.avatar || existing?.avatar,
      })
    }

    // getMyShares (unlike getSharedWithMe) isn't filtered server-side by
    // acceptance, so it includes shares the recipient hasn't accepted yet.
    // Offering someone here before they've accepted would let the user pick
    // them and then 403 against the server's canMessage check, which does
    // require an accepted share.
    ;(Array.isArray(myShares) ? (myShares as DataShare[]) : [])
      .filter((share) => share.status === 'ACCEPTED')
      .forEach((share) => add(share.sharedWith))
    ;(Array.isArray(sharedWithMe) ? (sharedWithMe as SharedWithMeUser[]) : []).forEach((share) => add(share.owner))

    return directory
  }, [myShares, sharedWithMe])
}

/** People the user shares with, deduplicated, for the "new conversation" list. */
export function useMessageablePeople(): MessagingPerson[] {
  const directory = useMessagingDirectory()
  return useMemo(
    () =>
      Array.from(directory.values()).sort((a, b) => (a.name || a.email || '').localeCompare(b.name || b.email || '')),
    [directory],
  )
}

/** The conversation the user already has with a given counterpart, if any. */
export function findConversationWith(
  conversations: Conversation[] | undefined,
  counterpartId: string,
  currentUserId: string | undefined,
): Conversation | undefined {
  return conversations?.find((conversation) => {
    const ids = conversation.participants?.map((participant) => participant.userId) ?? []
    return ids.includes(counterpartId) && (!currentUserId || ids.includes(currentUserId))
  })
}
