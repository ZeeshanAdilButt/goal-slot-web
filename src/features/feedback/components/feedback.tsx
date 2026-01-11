'use client'

import { useRef } from 'react'

import { FeedbackButtonDefault } from '@/features/feedback/components/feedback-button-default'
import { FeedbackButtonInline } from '@/features/feedback/components/feedback-button-inline'
import { FeedbackWidget } from '@/features/feedback/components/feedback-widget'
import { useAuthStore } from '@/lib/store'

interface FeedbackProps {
  label: string
  type?: 'default' | 'inline'
}

export const Feedback = ({ type = 'default', label }: FeedbackProps) => {
  const { isAuthenticated, isLoading } = useAuthStore()
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  if (isLoading || !isAuthenticated) return null

  return type === 'default' || type === undefined ? (
    <div className="relative">
      <FeedbackButtonDefault label={label} ref={buttonRef} />
      <FeedbackWidget anchorRef={buttonRef} />
    </div>
  ) : (
    <FeedbackButtonInline label={label} />
  )
}
