'use client'

import { useEffect, useMemo } from 'react'

import { useMessagingTokenQuery } from '@/features/messaging/hooks/use-messaging-token'
import { isMessagingConfigured } from '@/features/messaging/utils/config'
import { rememberPeople } from '@/features/messaging/utils/directory'
import { hasUnreadMessages } from '@/features/messaging/utils/helpers'
import { KnownPeople, sortPeople, withPeople } from '@/features/messaging/utils/people'
import {
  fetchConversation,
  fetchConversations,
  fetchMessages,
  messagingQueries,
} from '@/features/messaging/utils/queries'
import { Conversation, MessagingPerson, ThreadMessage } from '@/features/messaging/utils/types'
import { useMySharesQuery, useSharedWithMeQuery } from '@/features/sharing/hooks/use-sharing-queries'
import { DataShare, SharedWithMeUser } from '@/features/sharing/utils/types'
import { skipToken, useQuery, useQueryClient } from '@tanstack/react-query'

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
 * How often the unread badge re-checks. Both callers of the hook below
 * (`<AppSidebar/>` and `<FloatingMessagesButton/>`) live in the app shell, so
 * this is a permanent per-session cost: it runs the whole time any tab is
 * open, for every signed-in user, whether or not they have ever opened
 * Messages. At the old 30s that was ~2,900 requests per user per day purely
 * to keep a number on a nav item.
 *
 * Two minutes because a badge is an ambient hint, not a delivery mechanism —
 * nothing is lost by learning about a message slightly later, and the moment
 * the user actually opens Messages the page mounts its own unthrottled
 * `useConversationsQuery()` and `useMessagingSocket()`, which push new
 * messages live. `refetchIntervalInBackground` defaults to false, so a
 * backgrounded tab already costs nothing.
 */
const UNREAD_BADGE_POLL_MS = 120_000

/**
 * Total unread conversations, for a badge outside the Messages page itself
 * (the sidebar nav item). Polls independently of whatever else is reading
 * this same query - WebSocket-driven live updates only reach a client
 * that already has the conversation list mounted and connected, which a
 * user who never opens the Messages page never does.
 */
export function useUnreadConversationsCount(): number {
  const currentUserId = useAuthStore((state) => state.user?.id)
  const conversationsQuery = useConversationsQuery({ refetchInterval: UNREAD_BADGE_POLL_MS })

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

const NO_KNOWN_PEOPLE: KnownPeople = {}

/**
 * Names we have already resolved, kept so they outlive whatever supplied
 * them.
 *
 * `skipToken` because this query is never fetched: it is a local store that
 * happens to live in the query cache, written only through
 * `rememberPeople`. That also means an invalidate of the messaging root
 * cannot blank it, and there is no in-flight fetch that could resolve on
 * top of a write.
 */
function useKnownPeople(): KnownPeople {
  return (
    useQuery<KnownPeople>({
      queryKey: messagingQueries.knownPeople(),
      queryFn: skipToken,
      staleTime: Infinity,
      gcTime: Infinity,
    }).data ?? NO_KNOWN_PEOPLE
  )
}

/** Both directions of the sharing graph, as people rather than as shares. */
function useSharingPeople(): MessagingPerson[] {
  const mySharesQuery = useMySharesQuery()
  const sharedWithMeQuery = useSharedWithMeQuery()

  const myShares = mySharesQuery.data
  const sharedWithMe = sharedWithMeQuery.data

  return useMemo(() => {
    const people: MessagingPerson[] = []

    // Unlike `useMessageablePeople` below, this is not filtered by
    // acceptance. Acceptance decides who you may open a conversation
    // with; it has no bearing on whether we are allowed to put a name on
    // an id we already have on screen.
    ;(Array.isArray(myShares) ? (myShares as DataShare[]) : []).forEach((share) => {
      if (share.sharedWith) people.push(share.sharedWith)
    })
    ;(Array.isArray(sharedWithMe) ? (sharedWithMe as SharedWithMeUser[]) : []).forEach((share) => {
      if (share.owner) people.push(share.owner)
    })

    return people
  }, [myShares, sharedWithMe])
}

/**
 * jiffy-messaging only knows participants by user id, so every name in
 * Messages is resolved here.
 *
 * The sharing graph is the only place the web client can read a name from,
 * but it is the *current* graph: revoking a share deletes the row outright
 * (`SharingService.revokeAccess`), which used to retroactively anonymize a
 * conversation that had been running for months into `Member 606d49`. So
 * the graph seeds a remembered set rather than being the set: once an id
 * has a name it keeps it, until the signed-in identity changes and the
 * whole client cache goes with it.
 *
 * A real fix for the remaining hole - a participant whose name this client
 * has never seen, e.g. one resolved on another device - needs the
 * participant name to come down with the conversation. See #307.
 */
export function useMessagingDirectory(): Map<string, MessagingPerson> {
  const queryClient = useQueryClient()
  const known = useKnownPeople()
  const sharingPeople = useSharingPeople()

  useEffect(() => {
    rememberPeople(queryClient, sharingPeople)
  }, [queryClient, sharingPeople])

  // Merged rather than read straight out of `known` so a name is on screen
  // in the same render the sharing query resolved in, instead of waiting a
  // frame for the effect above to write it back.
  return useMemo(() => new Map(Object.entries(withPeople(known, sharingPeople))), [known, sharingPeople])
}

/**
 * People the user shares with, deduplicated, for the "new conversation"
 * list.
 *
 * Accepted shares only, in both directions. `getMyShares` (unlike
 * `getSharedWithMe`) is not filtered server-side by acceptance, and
 * offering someone here before they have accepted would let the user pick
 * them and then 403 against the server's `canMessage` check, which does
 * require an accepted share.
 */
export function useMessageablePeople(): MessagingPerson[] {
  const mySharesQuery = useMySharesQuery()
  const sharedWithMeQuery = useSharedWithMeQuery()

  const myShares = mySharesQuery.data
  const sharedWithMe = sharedWithMeQuery.data

  return useMemo(() => {
    const people = withPeople(
      {},
      (Array.isArray(myShares) ? (myShares as DataShare[]) : [])
        .filter((share) => share.status === 'ACCEPTED')
        .map((share) => share.sharedWith),
    )

    return sortPeople(
      Object.values(
        withPeople(
          people,
          (Array.isArray(sharedWithMe) ? (sharedWithMe as SharedWithMeUser[]) : []).map((share) => share.owner),
        ),
      ),
    )
  }, [myShares, sharedWithMe])
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
