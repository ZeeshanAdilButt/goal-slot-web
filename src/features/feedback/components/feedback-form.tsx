import { useState } from 'react'

import { FeedbackEmojiSelector } from '@/features/feedback/components/feedback-emoji-selector'
import { MSupportedIcon } from '@/features/feedback/components/feedback-icons'
import { Button1 } from '@/features/feedback/components/ui/button-1'
import { useCreateFeedbackMutation } from '@/features/feedback/hooks/use-feedback-mutations'

import { Textarea } from '@/components/ui/textarea'

interface FeedbackFormProps {
  onSuccess?: () => void
  variant?: 'default' | 'inline'
}

export const FeedbackForm = ({ onSuccess, variant = 'default' }: FeedbackFormProps) => {
  const [selectedEmoji, setSelectedEmoji] = useState<number | null>(null)
  const [feedbackText, setFeedbackText] = useState<string>('')

  const createMutation = useCreateFeedbackMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Don't submit if neither emoji nor text is provided
    if (selectedEmoji === null && !feedbackText.trim()) {
      return
    }

    createMutation.mutate(
      {
        emoji: selectedEmoji ?? undefined,
        text: feedbackText.trim() || undefined,
      },
      {
        onSuccess: () => {
          setSelectedEmoji(null)
          setFeedbackText('')
          onSuccess?.()
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2 p-2">
        <Textarea
          placeholder="Your feedback..."
          className="h-[100px]"
          value={feedbackText}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFeedbackText(e.target.value)}
        />
        <div className="ml-auto flex items-center gap-1 text-sm text-gray-900">
          <MSupportedIcon /> supported.
        </div>
      </div>
      <div
        className="flex justify-between border-t p-3"
        style={{ backgroundColor: 'var(--accents-1)', borderColor: 'var(--accents-2)' }}
      >
        <FeedbackEmojiSelector selectedEmoji={selectedEmoji} onEmojiSelect={setSelectedEmoji} variant={variant} />
        <Button1 size="small" htmlType="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Sending...' : 'Send'}
        </Button1>
      </div>
    </form>
  )
}
