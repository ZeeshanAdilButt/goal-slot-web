'use client'

import { forwardRef } from 'react'
import { MessageSquare } from 'lucide-react'

import { Button1 } from '@/features/feedback/components/ui/button-1'
import { useFeedbackWidgetStore } from '@/features/feedback/store/use-feedback-widget-store'

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
      className="!h-10 !w-10 !p-0 font-medium md:!h-auto md:!w-auto md:!px-4 md:!py-2"
      title={label}
    >
      <MessageSquare className="h-5 w-5 md:hidden" />
      <span className="hidden md:inline">{label}</span>
    </Button1>
  )
})

FeedbackButtonDefault.displayName = 'FeedbackButtonDefault'
