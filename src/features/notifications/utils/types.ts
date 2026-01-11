export type NotificationType = 'FEEDBACK_REPLY'

export interface AppNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body?: string | null
  data?: any
  readAt?: string | null
  createdAt: string
}

export interface NotificationListResponse {
  items: AppNotification[]
  nextCursor?: string
  hasMore: boolean
  unreadCount: number
}
