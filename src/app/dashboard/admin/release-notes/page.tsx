'use client'

import { useState } from 'react'

import { AdminReleaseNotesForm } from '@/features/release-notes/components/admin-release-notes-form'
import { AdminReleaseNotesList } from '@/features/release-notes/components/admin-release-notes-list'
import { ReleaseNote } from '@/features/release-notes/utils/types'

import { PageHeader } from '@/components/ui/page-header'
import { PageShell } from '@/components/ui/page-shell'

export default function AdminReleaseNotesPage() {
  const [editingNote, setEditingNote] = useState<ReleaseNote | null>(null)

  return (
    <PageShell>
      <PageHeader
        eyebrow="Admin"
        title="Release Notes"
        description="Publish a new release note that users will see until they acknowledge the latest version."
      />
      <AdminReleaseNotesForm editingNote={editingNote} onCancelEdit={() => setEditingNote(null)} />
      <AdminReleaseNotesList onEdit={setEditingNote} />
    </PageShell>
  )
}
