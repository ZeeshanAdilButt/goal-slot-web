'use client'

import { format } from 'date-fns'
import { Trash2, Edit } from 'lucide-react'

import { useReleaseNotesList, useDeleteReleaseNote } from '../hooks/use-release-notes-admin'
import { Button } from '@/components/ui/button'
import { ReleaseNote } from '../utils/types'

interface AdminReleaseNotesListProps {
  onEdit?: (note: ReleaseNote) => void
}

export const AdminReleaseNotesList = ({ onEdit }: AdminReleaseNotesListProps) => {
  const { data: notes, isLoading } = useReleaseNotesList()
  const deleteMutation = useDeleteReleaseNote()

  if (isLoading) {
    return <div className="py-4 text-center">Loading release notes...</div>
  }

  if (!notes?.length) {
    return <div className="py-4 text-center text-gray-500">No release notes found.</div>
  }

  const handleDelete = (id: string, version: string) => {
    if (confirm(`Are you sure you want to delete release note ${version}?`)) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="mt-8 space-y-4 rounded-md border-3 border-secondary bg-white p-4 shadow-brutal">
      <h2 className="text-lg font-bold">Release History</h2>
      <div className="space-y-4">
        {notes.map((note) => (
          <div key={note.id} className="flex flex-col gap-2 border-b pb-4 last:border-0 last:pb-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{note.version}</span>
                  <span className="text-sm text-gray-500">
                    {format(new Date(note.publishedAt), 'PPP')}
                  </span>
                </div>
                <h3 className="font-semibold">{note.title}</h3>
                <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-gray-600">
                  {note.content}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(note)}
                    disabled={deleteMutation.isPending}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(note.id, note.version)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
