'use client'

import { useEffect, useRef, useState } from 'react'

import { FeedbackEmojiSelector } from '@/features/feedback/components/feedback-emoji-selector'
import { FeedbackForm } from '@/features/feedback/components/feedback-form'
import clsx from 'clsx'

import { useClickOutside } from '@/hooks/use-click-outside'
import { useAuthStore } from '@/lib/store'

interface FeedbackButtonInlineProps {
  label: string
}

export const FeedbackButtonInline = ({ label }: FeedbackButtonInlineProps) => {
  const { isAuthenticated, isLoading } = useAuthStore()
  const [expanded, setExpanded] = useState<boolean>(false)
  const [selectedEmoji, setSelectedEmoji] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement | null>(null)
  const [showContent, setShowContent] = useState(false)

  if (!isLoading && !isAuthenticated) return null

  useEffect(() => {
    if (expanded) {
      setShowContent(true)
    } else {
      const timeout = setTimeout(() => setShowContent(false), 300)
      return () => clearTimeout(timeout)
    }
  }, [expanded])

  useClickOutside(ref, () => {
    setExpanded(false)
    setSelectedEmoji(null)
  })

  const handleEmojiSelect = (emoji: number | null) => {
    setSelectedEmoji(emoji)
    setExpanded(emoji !== null)
  }

  const handleSuccess = () => {
    setExpanded(false)
    setSelectedEmoji(null)
  }

  return (
    <div
      className={clsx(
        'bg-background-100 flex w-fit flex-col justify-start overflow-hidden shadow-border-small duration-200',
        expanded ? 'max-h-[243px] rounded-xl' : 'max-h-12 rounded-[30px]',
      )}
      ref={ref}
    >
      <div
        className={clsx('flex items-center justify-center gap-2 py-2 pl-4 pr-2 duration-200', expanded && '!px-[60px]')}
      >
        <p className="text-sm text-gray-900">{label}</p>
        <FeedbackEmojiSelector selectedEmoji={selectedEmoji} onEmojiSelect={handleEmojiSelect} variant="inline" />
      </div>
      {showContent && (
        <div className="w-full opacity-100 transition-opacity duration-300">
          <FeedbackForm onSuccess={handleSuccess} variant="inline" />
        </div>
      )}
    </div>
  )
}
