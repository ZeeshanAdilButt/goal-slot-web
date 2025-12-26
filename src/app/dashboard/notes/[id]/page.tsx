'use client'

import { use } from 'react'

import { NotesPage } from '@/features/notes'

interface NotePageProps {
  params: Promise<{ id: string }>
}

export default function NotePage({ params }: NotePageProps) {
  const { id } = use(params)

  return (
    <div className="h-[calc(100vh-64px)] md:h-[calc(100vh-24px)]">
      <NotesPage initialNoteId={id} />
    </div>
  )
}
