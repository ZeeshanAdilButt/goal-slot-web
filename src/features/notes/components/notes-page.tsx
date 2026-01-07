'use client'

import { useIsMobile } from '@/hooks/use-mobile'

import { NotesPageDesktop } from './notes-page-desktop'
import { NotesPageMobile } from './notes-page-mobile'

interface NotesPageProps {
  initialNoteId?: string
}

export function NotesPage({ initialNoteId }: NotesPageProps = {}) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <NotesPageMobile initialNoteId={initialNoteId} />
  }

  return <NotesPageDesktop initialNoteId={initialNoteId} />
}
