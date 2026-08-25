'use client'

import { useRouter } from 'next/navigation'

import { useStartConversationMutation } from '@/features/messaging/hooks/use-messaging-mutations'
import { isMessagingConfigured } from '@/features/messaging/utils/config'
import { MessageSquare } from 'lucide-react'

import { Button, ButtonProps } from '@/components/ui/button'

export const messagingConversationHref = (conversationId: string) =>
  `/dashboard/messages?c=${encodeURIComponent(conversationId)}`

interface StartConversationButtonProps {
  /** GoalSlot user id of the person to talk to. */
  userId: string
  /** Used for the accessible name, e.g. "Message Priya". */
  name: string
  label?: string
  iconOnly?: boolean
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
  className?: string
}

/**
 * Entry point into messaging from anywhere a sharing relationship is already
 * on screen. Renders nothing when messaging is not configured, so the Sharing
 * screen is unchanged on deployments without the service.
 */
export function StartConversationButton({
  userId,
  name,
  label = 'Message',
  iconOnly = false,
  variant = 'secondary',
  size = 'sm',
  className,
}: StartConversationButtonProps) {
  const router = useRouter()
  const startConversation = useStartConversationMutation()

  if (!isMessagingConfigured) return null

  const handleClick = () => {
    startConversation.mutate(userId, {
      onSuccess: ({ conversationId }) => router.push(messagingConversationHref(conversationId)),
    })
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={iconOnly ? 'icon' : size}
      className={className}
      onClick={handleClick}
      disabled={startConversation.isPending}
      aria-label={`Message ${name}`}
      title={`Message ${name}`}
    >
      <MessageSquare className="h-4 w-4" />
      {!iconOnly && <span>{startConversation.isPending ? 'Opening...' : label}</span>}
    </Button>
  )
}
