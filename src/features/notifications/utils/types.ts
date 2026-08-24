/**
 * Mirrors the `NotificationType` enum in the API's Prisma schema
 * (goal-slot-api/prisma/schema.prisma).
 *
 * This was a one-member union containing only 'FEEDBACK_REPLY' for a long
 * time, which is why the notification list could route exactly one of five
 * types and the compiler never objected: as far as the web client was
 * concerned the other four did not exist. Keep this in sync with the enum —
 * `resolveNotificationAction` switches over it exhaustively, so adding a
 * member here is what forces the routing decision to be made.
 */
export type NotificationType =
  | 'FEEDBACK_REPLY'
  | 'SHARED_REPORT_UNVIEWED'
  | 'INSTRUCTION_ASSIGNED'
  | 'MESSAGE_RECEIVED'
  | 'APP_RELEASE'

/**
 * Which slice of the feed a request is about.
 *
 * - `all`     — every notification, including MESSAGE_RECEIVED.
 * - `general` — everything *except* MESSAGE_RECEIVED.
 *
 * The bell asks for `general`, because message notifications are surfaced on
 * the Messages button instead (see FloatingMessagesButton). The scope applies
 * to `unreadCount` as well as `items`, so the bell's badge can never show a
 * number its own list cannot account for.
 */
export type NotificationScope = 'all' | 'general'

/**
 * The routing payload the API stores on a notification and also sends as the
 * web-push `data`. Every dispatch path writes the same object to both places
 * (see reminder-dispatch.service.ts), which is what lets one resolver serve
 * both the in-app list and the service worker.
 *
 * `type` here is the payload's own discriminant ('conversation', 'schedule',
 * 'instruction', 'release', 'feedback') — deliberately *not* the same
 * vocabulary as `NotificationType` above. The service worker only ever sees
 * this discriminant, never the enum.
 */
export interface NotificationPayload {
  type?: string
  /** Not written by any dispatch path today; honoured defensively if it ever is. */
  url?: string
  conversationId?: string
  sharedAccessId?: string
  instructionId?: string
  feedbackId?: string
  responseId?: string
  [key: string]: unknown
}

export interface AppNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body?: string | null
  data?: NotificationPayload | null
  readAt?: string | null
  createdAt: string
}

export interface NotificationListResponse {
  items: AppNotification[]
  nextCursor?: string
  hasMore: boolean
  /** Scoped: counts only the notifications this same response would list. */
  unreadCount: number
  /**
   * Echo of the scope the API applied. Optional because a deployment running
   * an API build from before scope support simply omits it; nothing reads it,
   * it is here so the shape is documented rather than surprising.
   */
  scope?: NotificationScope
}

export interface MarkAllNotificationsReadResponse {
  updated: number
  scope: NotificationScope
  /**
   * Always 0 — the call just cleared every unread row in the scope, so it is 0
   * by construction rather than by a follow-up query. Set the badge straight
   * off this; do not refetch to learn a number you already know.
   */
  unreadCount: number
}
