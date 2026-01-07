'use client'

import { FeedbackButtonDefault } from '@/features/feedback/components/feedback-button-default'
import { FeedbackButtonInline } from '@/features/feedback/components/feedback-button-inline'

interface FeedbackProps {
  label: string
  type?: 'default' | 'inline'
}

export const Feedback = ({ type = 'default', label }: FeedbackProps) => {
  return type === 'default' || type === undefined ? (
    <FeedbackButtonDefault label={label} />
  ) : (
    <FeedbackButtonInline label={label} />
  )
}
