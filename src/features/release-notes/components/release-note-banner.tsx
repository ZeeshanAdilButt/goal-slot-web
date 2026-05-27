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
    <div className={clsx('border-b border-yellow-200 bg-yellow-50 px-4 py-3 md:px-6 md:py-4')}>
      <div className="flex items-start gap-3">
        <Megaphone className="h-5 w-5 text-yellow-700" />
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-base font-semibold text-zinc-900">
            <span>{note.title}</span>
            <span className="inline-flex items-center rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-yellow-700">{note.version}</span>
            <span className="text-xs text-zinc-500">Published {formatDate(note.publishedAt)}</span>
            {unseenNotes && unseenNotes.length > 1 && (
               <span className="text-xs font-semibold text-yellow-700">+{unseenNotes.length - 1} more</span>
            )}
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">{note.content}</p>
        </div>
        <button onClick={handleDismiss} className="text-zinc-500 hover:text-zinc-900" aria-label="Dismiss release note">
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
