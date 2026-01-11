'use client'

import { useState, useEffect } from 'react'
import { Megaphone, Save, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { useCreateReleaseNote, useUpdateReleaseNote } from '@/features/release-notes/hooks/use-create-release-note'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ReleaseNote } from '../utils/types'

interface AdminReleaseNotesFormProps {
  editingNote?: ReleaseNote | null
  onCancelEdit?: () => void
}

export const AdminReleaseNotesForm = ({ editingNote, onCancelEdit }: AdminReleaseNotesFormProps) => {
  const createMutation = useCreateReleaseNote()
  const updateMutation = useUpdateReleaseNote()
  
  const [version, setVersion] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [publishedAt, setPublishedAt] = useState('')
  const [republish, setRepublish] = useState(false)

  useEffect(() => {
    if (editingNote) {
      setVersion(editingNote.version)
      setTitle(editingNote.title)
      setContent(editingNote.content)
      setPublishedAt(editingNote.publishedAt ? new Date(editingNote.publishedAt).toISOString().split('T')[0] : '')
      setRepublish(false)
    } else {
      setVersion('')
      setTitle('')
      setContent('')
      setPublishedAt('')
      setRepublish(false)
    }
  }, [editingNote])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!version.trim() || !title.trim() || !content.trim()) {
      toast.error('Version, title, and content are required')
      return
    }

    if (editingNote) {
      updateMutation.mutate({
        id: editingNote.id,
        data: {
          version: version.trim(),
          title: title.trim(),
          content: content.trim(),
          publishedAt: publishedAt || undefined,
          resetSeen: republish
        }
      }, {
        onSuccess: () => {
          if (onCancelEdit) onCancelEdit()
        }
      })
    } else {
      createMutation.mutate({ version: version.trim(), title: title.trim(), content: content.trim(), publishedAt: publishedAt || undefined }, {
        onSuccess: () => {
          setContent('')
          setTitle('')
          setVersion('')
          setPublishedAt('')
        },
      })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-4 rounded-md border-3 border-secondary bg-white p-4 shadow-brutal">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">{editingNote ? 'Edit Release Note' : 'Publish Release Note'}</h2>
        </div>
        {editingNote && (
          <Button variant="ghost" size="sm" onClick={onCancelEdit}>
            <X className="h-4 w-4 mr-1" /> Cancel Edit
          </Button>
        )}
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-800">Version</label>
            <Input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="v1.2.3"
              disabled={isPending}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-800">Publish date (optional)</label>
            <Input
              type="date"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-800">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What’s new in this release"
            disabled={isPending}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-800">Content</label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="List improvements, fixes, and highlights..."
            className="min-h-[180px]"
            disabled={isPending}
          />
          <p className="text-xs text-gray-600">This text is shown to all users until they dismiss the latest note.</p>
        </div>

        {editingNote && (
          <div className="flex items-center space-x-2 rounded border border-yellow-200 bg-yellow-50 p-2">
            <Checkbox 
              id="republish" 
              checked={republish}
              onCheckedChange={(checked) => setRepublish(checked as boolean)}
            />
            <label
              htmlFor="republish"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-yellow-800"
            >
              Republish as new (reset seen status for all users)
            </label>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} className="flex items-center gap-2">
            {isPending ? (
              'Saving...'
            ) : (
              <>
                <Save className="h-4 w-4" />
                {editingNote ? 'Update Note' : 'Publish'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
