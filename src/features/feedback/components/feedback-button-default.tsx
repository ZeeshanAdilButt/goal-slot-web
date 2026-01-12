'use client'

import { forwardRef } from 'react'

import { Button1 } from '@/features/feedback/components/ui/button-1'
import { useFeedbackWidgetStore } from '@/features/feedback/store/use-feedback-widget-store'
import { MessageSquare } from 'lucide-react'

interface FeedbackButtonDefaultProps {
  label: string
}

export const FeedbackButtonDefault = forwardRef<HTMLButtonElement, FeedbackButtonDefaultProps>(({ label }, ref) => {
  const openNew = useFeedbackWidgetStore((state) => state.openNew)

  return (
    <Button1
      type="secondary"
      size="small"
      ref={ref}
      onClick={() => openNew()}
      className="!h-8 !w-8 !p-0 font-medium"
      title={label}
    >
      <MessageSquare className="h-4 w-4" />
    </Button1>
  )
})

FeedbackButtonDefault.displayName = 'FeedbackButtonDefault'
