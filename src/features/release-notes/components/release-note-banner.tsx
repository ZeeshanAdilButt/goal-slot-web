'use client'

import { useEffect, useState } from 'react'
import { Megaphone, X } from 'lucide-react'
import clsx from 'clsx'

import { useLatestReleaseNote, useMarkReleaseNoteSeen } from '@/features/release-notes/hooks/use-release-notes'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

export const ReleaseNoteBanner = () => {
  const { data, isLoading } = useLatestReleaseNote()
  const markSeen = useMarkReleaseNoteSeen()
  const [dismissedId, setDismissedId] = useState<string | null>(null)

  const note = data?.note
  const isSeen = data?.seen
  const shouldHide = isLoading || !note || isSeen || dismissedId === note.id

  useEffect(() => {
    // Reset local dismissal when a new note arrives
    if (note && dismissedId && dismissedId !== note.id) {
      setDismissedId(null)
    }
  }, [note, dismissedId])

  if (shouldHide) return null

  const handleSeen = () => {
    if (!note) return
    markSeen.mutate(note.id)
  }

  const handleDismiss = () => {
    if (!note) return
    setDismissedId(note.id)
    markSeen.mutate(note.id)
  }

  return (
    <div className={clsx('border-b border-secondary bg-white px-4 py-3 shadow-brutal md:px-6 md:py-4')}>
      <div className="flex items-start gap-3">
        <Megaphone className="h-5 w-5 text-primary" />
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900">
            <span>{note.title}</span>
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs uppercase text-secondary">{note.version}</span>
            <span className="text-xs text-gray-600">Published {formatDate(note.publishedAt)}</span>
          </div>
          <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">{note.content}</p>
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
