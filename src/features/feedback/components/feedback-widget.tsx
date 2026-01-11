'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Loader2, Send, X } from 'lucide-react'
import clsx from 'clsx'

import { FeedbackForm } from '@/features/feedback/components/feedback-form'
import { Material } from '@/features/feedback/components/ui/material-1'
import { useCreateFeedbackResponseMutation, useFeedbackThreadQuery } from '@/features/feedback/hooks/use-feedback-thread'
import { useFeedbackWidgetStore } from '@/features/feedback/store/use-feedback-widget-store'
import { useClickOutside } from '@/hooks/use-click-outside'
import { Textarea } from '@/components/ui/textarea'
import { Button1 } from '@/features/feedback/components/ui/button-1'
import { formatDate } from '@/lib/utils'

export const FeedbackWidget = ({ anchorRef }: { anchorRef: React.RefObject<HTMLButtonElement | null> }) => {
  const { isOpen, view, close, openNew } = useFeedbackWidgetStore()
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState<React.CSSProperties>({ bottom: 52, right: 0 })
  const [reply, setReply] = useState('')

  const threadQuery = useFeedbackThreadQuery(view.mode === 'thread' ? view.feedbackId : undefined, view.mode === 'thread')
  const createResponse = useCreateFeedbackResponseMutation(view.mode === 'thread' ? view.feedbackId : '')

  useEffect(() => {
    const updatePosition = () => {
      if (!isOpen) return
      if (anchorRef.current && menuRef.current) {
        const buttonRect = anchorRef.current.getBoundingClientRect()
        const menuHeight = menuRef.current.offsetHeight
        const next: React.CSSProperties = {
          bottom: buttonRect.height + 8,
          right: 0,
        }
        if (buttonRect.top - menuHeight < 8) {
          next.maxHeight = `${buttonRect.top - 8}px`
          next.overflowY = 'auto'
        }
        setPosition(next)
      }
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition)
    }
  }, [isOpen, anchorRef])

  useClickOutside(menuRef, () => close())

  useEffect(() => {
    if (!isOpen) setReply('')
  }, [isOpen])

  const feedback = threadQuery.data?.feedback
  const responses = useMemo(() => threadQuery.data?.responses ?? [], [threadQuery.data])

  const handleSendReply = () => {
    const message = reply.trim()
    if (!message || view.mode !== 'thread') return
    createResponse.mutate(message, {
      onSuccess: () => setReply(''),
    })
  }

  if (!isOpen) return null

  return (
    <Material
      type="menu"
      className={clsx('absolute w-[360px] font-sans duration-200', isOpen ? 'opacity-100' : 'pointer-events-none opacity-0')}
      style={{ ...position }}
      ref={menuRef}
    >
      <div className="flex items-center justify-between border-b px-3 py-2 text-sm font-semibold" style={{ borderColor: 'var(--accents-2)' }}>
        {view.mode === 'thread' ? (
          <div className="flex items-center gap-2">
            <button className="text-gray-600 hover:text-gray-900" onClick={openNew} aria-label="Back to new feedback">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span>Feedback thread</span>
          </div>
        ) : (
          <span>Send feedback</span>
        )}
        <button className="text-gray-600 hover:text-gray-900" onClick={close} aria-label="Close feedback widget">
          <X className="h-4 w-4" />
        </button>
      </div>

      {view.mode === 'new' && <FeedbackForm onSuccess={close} variant="default" />}

      {view.mode === 'thread' && (
        <div className="space-y-3 p-3">
          {threadQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading thread...
            </div>
          ) : (
            <div className="space-y-3">
              {feedback && (
                <div className="rounded-md border bg-white p-3" style={{ borderColor: 'var(--accents-2)' }}>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span className="font-semibold text-gray-800">You</span>
                    <span>{formatDate(feedback.createdAt)}</span>
                  </div>
                  {feedback.text ? (
                    <p className="mt-1 text-sm text-gray-900">{feedback.text}</p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-600">(No text provided)</p>
                  )}
                </div>
              )}

              {responses.length === 0 ? (
                <div className="text-sm text-gray-600">No replies yet.</div>
              ) : (
                <div className="space-y-2">
                  {responses.map((response) => {
                    const fromUser = feedback && response.senderId === feedback.userId
                    const displayName = fromUser ? 'You' : 'GoalSlot Support'
                    return (
                      <div key={response.id} className="rounded-md bg-gray-50 p-3">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span className="font-semibold text-gray-800">{displayName}</span>
                          <span>{formatDate(response.createdAt)}</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-900">{response.message}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Textarea
              placeholder="Write a reply..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              disabled={createResponse.isPending}
              className="min-h-[80px]"
            />
            <div className="flex justify-end">
              <Button1
                size="small"
                onClick={handleSendReply}
                disabled={createResponse.isPending || !reply.trim()}
                className="flex items-center gap-2"
              >
                {createResponse.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {createResponse.isPending ? 'Sending...' : 'Send reply'}
              </Button1>
            </div>
          </div>
        </div>
      )}
    </Material>
  )
}
