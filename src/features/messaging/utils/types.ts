export interface MessagingParticipant {
  userId: string
  lastReadAt: string | null
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  body: string
  createdAt: string
  /**
   * Set once the sender deleted the message for everyone. The service keeps
   * the row and empties the body, so a deleted message still occupies its
   * place in the thread and must render as a tombstone rather than as an
   * empty bubble. Optional because a response from a service older than the
   * delete endpoints omits it entirely; read it through `isDeletedMessage`.
   */
  deletedAt?: string | null
}

/**
 * A message as the thread renders it. `pending` marks an optimistic row that
 * has not been acknowledged by the server yet.
 */
export interface ThreadMessage extends Message {
  pending?: boolean
}

/**
 * jiffy-messaging guarantees `id` and `participants`; the activity fields vary
 * by version, so everything used purely for list ordering and previews is
 * optional and read through the helpers in `./helpers`.
 */
export interface Conversation {
  id: string
  participants?: MessagingParticipant[]
  createdAt?: string
  updatedAt?: string
  lastMessage?: Message | null
  lastMessageAt?: string | null
}

/** A counterpart resolved from the sharing graph, used to put names on ids. */
export interface MessagingPerson {
  id: string
  name?: string
  email?: string
  avatar?: string
}

export type MessagingConnectionStatus = 'disabled' | 'connecting' | 'open' | 'reconnecting' | 'offline'
