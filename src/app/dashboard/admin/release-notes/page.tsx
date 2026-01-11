'use client'

import { useState } from 'react'
import { AdminReleaseNotesForm } from '@/features/release-notes/components/admin-release-notes-form'
import { AdminReleaseNotesList } from '@/features/release-notes/components/admin-release-notes-list'
import { ReleaseNote } from '@/features/release-notes/utils/types'

export default function AdminReleaseNotesPage() {
  const [editingNote, setEditingNote] = useState<ReleaseNote | null>(null)

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-black uppercase tracking-tight">Release Notes</h1>
      <p className="text-sm text-gray-700">Publish a new release note that users will see until they acknowledge the latest version.</p>
      <AdminReleaseNotesForm 
        editingNote={editingNote} 
        onCancelEdit={() => setEditingNote(null)}
      />
      <AdminReleaseNotesList onEdit={setEditingNote} />
    </div>
  )
}
