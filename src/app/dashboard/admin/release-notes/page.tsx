'use client'

import { AdminReleaseNotesForm } from '@/features/release-notes/components/admin-release-notes-form'

export default function AdminReleaseNotesPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-black uppercase tracking-tight">Release Notes</h1>
      <p className="text-sm text-gray-700">Publish a new release note that users will see until they acknowledge the latest version.</p>
      <AdminReleaseNotesForm />
    </div>
  )
}
