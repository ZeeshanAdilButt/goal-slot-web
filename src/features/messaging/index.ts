export { MessagingPage, CONVERSATION_PARAM } from '@/features/messaging/components/messaging-page'
export {
  StartConversationButton,
  messagingConversationHref,
} from '@/features/messaging/components/start-conversation-button'
export {
  useConversationsQuery,
  useConversationQuery,
  useMessagesQuery,
  useMessagingDirectory,
  useMessageablePeople,
} from '@/features/messaging/hooks/use-messaging-queries'
export {
  useSendMessageMutation,
  useMarkConversationReadMutation,
  useStartConversationMutation,
  useDeleteMessageMutation,
  useDeleteConversationMutation,
} from '@/features/messaging/hooks/use-messaging-mutations'
export { useMessagingSocket } from '@/features/messaging/hooks/use-messaging-socket'
export {
  isMessagingConfigured,
  isMessagingRealtimeConfigured,
  messagingBaseUrl,
  messagingWsUrl,
} from '@/features/messaging/utils/config'
export { messagingQueries } from '@/features/messaging/utils/queries'
export type {
  Conversation,
  Message,
  MessagingConnectionStatus,
  MessagingParticipant,
  MessagingPerson,
  ThreadMessage,
} from '@/features/messaging/utils/types'
