'use client'

import { NotesPage } from '@/features/notes'

export default function NotesRoute() {
  return (
    <div className="h-[calc(100vh-64px)] md:h-[calc(100vh-24px)]">
      <NotesPage />
    </div>
  )
}
