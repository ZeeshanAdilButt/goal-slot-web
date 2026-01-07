import { useState } from 'react'
import Image from 'next/image'

import { useArchiveFeedbackMutation, useDeleteFeedbackMutation } from '@/features/feedback/hooks/use-feedback-mutations'
import { emojiLabels, Feedback as FeedbackType, getEmojiIcon } from '@/features/feedback/utils/types'
import { Archive, ArchiveRestore, Trash2 } from 'lucide-react'

import { cn, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'

interface FeedbackItemProps {
  feedback: FeedbackType
  onDelete: (feedback: FeedbackType) => void
}

export const FeedbackItem = ({ feedback, onDelete }: FeedbackItemProps) => {
  const [isArchiving, setIsArchiving] = useState(false)

  const archiveMutation = useArchiveFeedbackMutation()

  const handleArchive = async (archive: boolean) => {
    setIsArchiving(true)
    archiveMutation.mutate(
      { id: feedback.id, data: { isArchived: archive } },
      {
        onSettled: () => setIsArchiving(false),
      },
    )
  }

  return (
    <div className={cn('card-brutal p-6 transition-all', feedback.isArchived && 'opacity-60')}>
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
    </div>
  )
}
