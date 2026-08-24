import type { NotificationPayload, NotificationType } from './types'

/**
 * Where a notification click should land.
 *
 * Two surfaces consume this and they can do different things: the in-app list
 * can open a modal the service worker cannot, and the service worker can only
 * open a URL. Returning an *action* rather than a URL is what lets both share
 * one resolver without the worker pretending it can open a feedback thread.
 */
export type NotificationAction =
  | { kind: 'navigate'; href: string }
  | { kind: 'open-feedback-thread'; feedbackId: string }

/**
 * Where a notification with nothing more specific to say should land.
 *
 * Also the honest destination for INSTRUCTION_ASSIGNED and APP_RELEASE: web
 * has no per-instruction route, and the changelog is a modal on the dashboard
 * rather than a page, so /dashboard genuinely is where those two live.
 */
export const NOTIFICATION_FALLBACK_URL = '/dashboard'

export const MESSAGES_URL = '/dashboard/messages'

/** Must stay in sync with CONVERSATION_PARAM in messaging-page.tsx. */
const CONVERSATION_QUERY_PARAM = 'c'

export function conversationUrl(conversationId?: string): string {
  if (!conversationId) return MESSAGES_URL
  return `${MESSAGES_URL}?${CONVERSATION_QUERY_PARAM}=${encodeURIComponent(conversationId)}`
}

/**
 * Resolves a click on a notification to the thing that should happen.
 *
 * Routing keys off `data.type` — the payload's own discriminant — because
 * that is the one field both surfaces always have. The service worker never
 * sees the `NotificationType` enum at all, only the payload.
 *
 * `notificationType` is a fallback for rows whose payload carries no
 * discriminant. That is not hypothetical: every FEEDBACK_REPLY row written
 * before the API started stamping `type: 'feedback'` stores a bare
 * `{ feedbackId, responseId }`, and those rows are still in the table and
 * still in users' lists. Dropping the fallback would break them.
 */
export function resolveNotificationAction(notification: {
  type?: NotificationType
  data?: NotificationPayload | null
}): NotificationAction {
  const data = notification.data ?? {}

  // No dispatch path writes a literal url today, but honour one if a future
  // payload carries it rather than silently routing it to the dashboard.
  if (typeof data.url === 'string' && data.url) {
    return { kind: 'navigate', href: data.url }
  }

  switch (data.type) {
    case 'conversation':
      return { kind: 'navigate', href: conversationUrl(asString(data.conversationId)) }
    case 'schedule':
      // SHARED_REPORT_UNVIEWED. sharedAccessId is not deep-linkable on that
      // page yet, but the sharing tab beats the generic dashboard.
      return { kind: 'navigate', href: '/dashboard/sharing' }
    case 'feedback': {
      const feedbackId = asString(data.feedbackId)
      if (feedbackId) return { kind: 'open-feedback-thread', feedbackId }
      return { kind: 'navigate', href: NOTIFICATION_FALLBACK_URL }
    }
    case 'instruction':
    case 'release':
      return { kind: 'navigate', href: NOTIFICATION_FALLBACK_URL }
  }

  // Payload had no discriminant — fall back on the notification's own type.
  switch (notification.type) {
    case 'FEEDBACK_REPLY': {
      const feedbackId = asString(data.feedbackId)
      if (feedbackId) return { kind: 'open-feedback-thread', feedbackId }
      return { kind: 'navigate', href: NOTIFICATION_FALLBACK_URL }
    }
    case 'MESSAGE_RECEIVED':
      return { kind: 'navigate', href: conversationUrl(asString(data.conversationId)) }
    case 'SHARED_REPORT_UNVIEWED':
      return { kind: 'navigate', href: '/dashboard/sharing' }
    case 'INSTRUCTION_ASSIGNED':
    case 'APP_RELEASE':
    case undefined:
      return { kind: 'navigate', href: NOTIFICATION_FALLBACK_URL }
  }
}

/**
 * The service-worker view of the same resolver: a URL, always.
 *
 * A push click may have no page running at all, so there is nothing to open a
 * feedback thread *in* — the thread is a modal owned by the app shell, not a
 * route. The dashboard is the only honest landing spot for that one case.
 */
export function resolveNotificationUrl(data: NotificationPayload | undefined): string {
  const action = resolveNotificationAction({ data })
  return action.kind === 'navigate' ? action.href : NOTIFICATION_FALLBACK_URL
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined
}
