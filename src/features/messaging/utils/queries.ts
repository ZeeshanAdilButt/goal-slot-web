import { messagingRequest } from '@/features/messaging/utils/client'
import { MESSAGE_PAGE_SIZE } from '@/features/messaging/utils/config'
import { Conversation, Message, MessagingPerson } from '@/features/messaging/utils/types'

import { messagingApi } from '@/lib/api'

export const messagingQueries = {
  all: ['messaging'] as const,
  token: () => [...messagingQueries.all, 'token'] as const,
  conversations: () => [...messagingQueries.all, 'conversations'] as const,
  conversationRoot: () => [...messagingQueries.all, 'conversation'] as const,
  conversation: (conversationId: string) => [...messagingQueries.conversationRoot(), conversationId] as const,
  messagesRoot: () => [...messagingQueries.all, 'messages'] as const,
  messages: (conversationId: string) => [...messagingQueries.messagesRoot(), conversationId] as const,
  /**
   * Not a fetch: the client-side name cache behind `useMessagingDirectory`,
   * written through `rememberPeople` in `./directory`.
   */
  knownPeople: () => [...messagingQueries.all, 'known-people'] as const,
}

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : [])

/**
 * The GoalSlot API mints the messaging token. Its exact envelope is owned by
 * the API, so accept the shapes it could reasonably use rather than coupling
 * the UI to one key.
 */
export const fetchMessagingToken = async (): Promise<string> => {
  const res = await messagingApi.token()
  const payload = res.data as string | { token?: string; accessToken?: string; messagingToken?: string } | undefined

  const token =
    typeof payload === 'string' ? payload : payload?.token || payload?.accessToken || payload?.messagingToken

  if (!token) throw new Error('The messaging token response did not contain a token.')
  return token
}

export interface OpenedConversation {
  conversationId: string
  /**
   * The person on the other end, as GoalSlot knows them. jiffy-messaging
   * itself only ever returns bare user ids, so this response is the one
   * place the messaging surface hands back a name - worth keeping.
   */
  counterpart?: MessagingPerson
}

interface OpenConversationPayload {
  id?: string
  conversationId?: string
  counterpart?: { id?: string; name?: string; email?: string; avatar?: string | null }
}

/**
 * Asks GoalSlot to open (or reuse) the conversation with a counterpart. The
 * API enforces that a sharing relationship exists and answers 403 when it
 * does not, which is why this never talks to the messaging service directly.
 */
export const createConversationWith = async (userId: string): Promise<OpenedConversation> => {
  const res = await messagingApi.createConversation(userId)
  const payload = res.data as string | OpenConversationPayload | undefined

  const conversationId = typeof payload === 'string' ? payload : payload?.id || payload?.conversationId

  if (!conversationId) throw new Error('The server did not return a conversation id.')

  const counterpart = typeof payload === 'string' ? undefined : payload?.counterpart
  return {
    conversationId,
    counterpart: counterpart?.id
      ? {
          id: counterpart.id,
          name: counterpart.name,
          email: counterpart.email,
          avatar: counterpart.avatar ?? undefined,
        }
      : undefined,
  }
}

export const fetchConversations = async (token: string): Promise<Conversation[]> => {
  const res = await messagingRequest<Conversation[]>('/conversations', { token })
  return asArray<Conversation>(res)
}

export const fetchConversation = (token: string, conversationId: string): Promise<Conversation> =>
  messagingRequest<Conversation>(`/conversations/${encodeURIComponent(conversationId)}`, { token })

/** Returns messages oldest-first, which is also the order the thread renders. */
export const fetchMessages = async (token: string, conversationId: string, before?: string): Promise<Message[]> => {
  const res = await messagingRequest<Message[]>(`/conversations/${encodeURIComponent(conversationId)}/messages`, {
    token,
    query: { limit: MESSAGE_PAGE_SIZE, before },
  })
  return asArray<Message>(res)
}

export const postMessage = (token: string, conversationId: string, body: string): Promise<Message> =>
  messagingRequest<Message>(`/conversations/${encodeURIComponent(conversationId)}/messages`, {
    token,
    method: 'POST',
    body: { body },
  })

export const postConversationRead = (token: string, conversationId: string): Promise<void> =>
  messagingRequest<void>(`/conversations/${encodeURIComponent(conversationId)}/read`, {
    token,
    method: 'POST',
  })

/**
 * Deletes a message for everyone in the conversation. The service allows
 * this only for the account that sent it and answers 403 otherwise, so the
 * hidden button is a courtesy and never the check.
 *
 * Answers with the tombstone - same id, empty body, a `deletedAt` - which is
 * what goes back into the cache in place of the original.
 */
export const deleteMessage = (token: string, conversationId: string, messageId: string): Promise<Message> =>
  messagingRequest<Message>(
    `/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}`,
    { token, method: 'DELETE' },
  )

/**
 * Deletes the conversation for the signed-in user only. The other
 * participant keeps theirs, and anything they send afterwards brings this
 * one back with only the new messages in it.
 */
export const deleteConversation = (token: string, conversationId: string): Promise<void> =>
  messagingRequest<void>(`/conversations/${encodeURIComponent(conversationId)}`, {
    token,
    method: 'DELETE',
  })
