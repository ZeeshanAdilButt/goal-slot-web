'use client'

import { NotesPage } from '@/features/notes'

export default function NotesRoute() {
  return (
    <div className="h-[calc(100dvh-64px)] md:h-dvh">
      <NotesPage />
    </div>
  )
}
