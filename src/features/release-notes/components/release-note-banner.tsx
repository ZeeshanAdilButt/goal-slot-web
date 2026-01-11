'use client'

import { useEffect, useState } from 'react'
import { Megaphone, X } from 'lucide-react'
import clsx from 'clsx'

import { useLatestReleaseNote, useMarkReleaseNoteSeen, useUnseenReleaseNotes } from '@/features/release-notes/hooks/use-release-notes'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

export const ReleaseNoteBanner = () => {
  const { data: unseenNotes, isLoading } = useUnseenReleaseNotes()
  const markSeen = useMarkReleaseNoteSeen()
  
  // We only show the first unseen note in the list. 
  // When the user dismisses/marks it as seen, it is removed from the list (via optimistic update in the hook)
  // and the next one will appear.
  const note = unseenNotes && unseenNotes.length > 0 ? unseenNotes[0] : null
  
  const [dismissedId, setDismissedId] = useState<string | null>(null)

  // If we dismissed this specific note ID in this session, don't show it even if the list has it
  // (though the list should update if we did the optimistic update correctly)
  const shouldHide = isLoading || !note || dismissedId === note.id

  useEffect(() => {
    // Reset local dismissal when a new note arrives (e.g. after previous one was marked seen)
    if (note && dismissedId && dismissedId !== note.id) {
      setDismissedId(null)
    }
  }, [note, dismissedId])

  if (shouldHide || !note) return null

  const handleSeen = () => {
    markSeen.mutate(note.id)
  }

  const handleDismiss = () => {
    // Temporarily hide it locally, but also mark as seen to progress to the next
    setDismissedId(note.id)
    markSeen.mutate(note.id)
  }

  return (
    <div className={clsx('border-b border-secondary bg-white px-4 py-3 shadow-brutal md:px-6 md:py-4')}>
      <div className="flex items-start gap-3">
        <Megaphone className="h-5 w-5 text-primary" />
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-[17px] font-semibold text-gray-900">
            <span>{note.title}</span>
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs uppercase text-secondary">{note.version}</span>
            <span className="text-xs text-gray-600">Published {formatDate(note.publishedAt)}</span>
            {unseenNotes && unseenNotes.length > 1 && (
               <span className="text-xs font-bold text-primary">+{unseenNotes.length - 1} more</span>
            )}
          </div>
          <p className="text-[17px] leading-relaxed text-gray-800 whitespace-pre-wrap">{note.content}</p>
        </div>
        <button onClick={handleDismiss} className="text-gray-500 hover:text-gray-800" aria-label="Dismiss release note">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={handleSeen} disabled={markSeen.isPending}>
          {markSeen.isPending ? 'Saving…' : 'Got it'}
        </Button>
        <Button size="sm" variant="outline" onClick={handleDismiss} disabled={markSeen.isPending}>
          Dismiss
        </Button>
      </div>
    </div>
  )
}
