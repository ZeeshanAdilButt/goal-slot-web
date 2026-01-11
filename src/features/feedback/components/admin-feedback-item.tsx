import { useState } from 'react'
import Image from 'next/image'

import { useArchiveFeedbackMutation, useDeleteFeedbackMutation } from '@/features/feedback/hooks/use-feedback-mutations'
import { useCreateFeedbackResponseMutation, useFeedbackThreadQuery } from '@/features/feedback/hooks/use-feedback-thread'
import { useFeedbackWidgetStore } from '@/features/feedback/store/use-feedback-widget-store'
import { emojiLabels, Feedback as FeedbackType, getEmojiIcon } from '@/features/feedback/utils/types'
import { Archive, ArchiveRestore, Send, Trash2 } from 'lucide-react'

import { cn, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { Textarea } from '@/components/ui/textarea'

interface FeedbackItemProps {
  feedback: FeedbackType
  onDelete: (feedback: FeedbackType) => void
}

export const FeedbackItem = ({ feedback, onDelete }: FeedbackItemProps) => {
  const [isArchiving, setIsArchiving] = useState(false)
  const [reply, setReply] = useState('')

  const archiveMutation = useArchiveFeedbackMutation()
  const threadQuery = useFeedbackThreadQuery(feedback.id, true)
  const createResponse = useCreateFeedbackResponseMutation(feedback.id)
  const openThread = useFeedbackWidgetStore((state) => state.openThread)

  const handleArchive = async (archive: boolean) => {
    setIsArchiving(true)
    archiveMutation.mutate(
      { id: feedback.id, data: { isArchived: archive } },
      {
        onSettled: () => setIsArchiving(false),
      },
    )
  }

  const handleSendReply = () => {
    const message = reply.trim()
    if (!message) return
    createResponse.mutate(message, {
      onSuccess: () => setReply(''),
    })
  }

  return (
    <div className={cn('card-brutal p-2 transition-all sm:p-6', feedback.isArchived && 'opacity-60')}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {feedback.user.avatar ? (
              <Image
                src={feedback.user.avatar}
                alt={feedback.user.name}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold">
                {feedback.user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-bold">{feedback.user.name}</p>
              <p className="text-sm text-gray-600">{feedback.user.email}</p>
            </div>
            {feedback.emoji !== null && (
              <div className="ml-auto flex items-center gap-2">
                <span className="text-2xl">{getEmojiIcon(feedback.emoji)}</span>
                <span className="text-sm font-medium text-gray-600">{emojiLabels[feedback.emoji]}</span>
              </div>
            )}
          </div>

          {feedback.text && (
            <div className="mt-4 rounded-md bg-gray-50 p-4">
              <p className="text-sm leading-relaxed">{feedback.text}</p>
            </div>
          )}

          <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
            <span>Submitted: {formatDate(feedback.createdAt)}</span>
            {feedback.isArchived && feedback.archivedAt && <span>Archived: {formatDate(feedback.archivedAt)}</span>}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleArchive(!feedback.isArchived)}
            disabled={isArchiving || archiveMutation.isPending}
            className="flex items-center gap-2"
          >
            {isArchiving || archiveMutation.isPending ? (
              <Loading />
            ) : feedback.isArchived ? (
              <>
                <ArchiveRestore className="h-4 w-4" />
                Unarchive
              </>
            ) : (
              <>
                <Archive className="h-4 w-4" />
                Archive
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(feedback)}
            disabled={isArchiving || archiveMutation.isPending}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-3 rounded-md border p-4" style={{ borderColor: 'var(--accents-2)' }}>
        <div className="flex items-center justify-between text-sm font-semibold text-gray-800">
          <span>Thread</span>
          <div className="flex items-center gap-2">
            {threadQuery.isFetching && <span className="text-xs text-gray-500">Refreshing…</span>}
            <Button variant="secondary" size="sm" onClick={() => openThread(feedback.id)}>
              Open in widget
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {threadQuery.isLoading ? (
            <div className="text-sm text-gray-600">Loading thread…</div>
          ) : threadQuery.data && threadQuery.data.responses.length > 0 ? (
            threadQuery.data.responses.map((response) => (
              <div key={response.id} className="rounded-md bg-gray-50 p-3">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span className="font-semibold text-gray-800">{response.sender.name}</span>
                  <span>{formatDate(response.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-gray-900">{response.message}</p>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-600">No replies yet.</div>
          )}
        </div>

        <div className="space-y-2">
          <Textarea
            placeholder="Write a reply to this user…"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            disabled={createResponse.isPending}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSendReply}
              disabled={createResponse.isPending || !reply.trim()}
              className="flex items-center gap-2"
            >
              {createResponse.isPending ? <Loading /> : <Send className="h-4 w-4" />}
              {createResponse.isPending ? 'Sending…' : 'Send reply'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
