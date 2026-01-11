'use client'

import { useState } from 'react'
import { Megaphone, Save } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { useCreateReleaseNote } from '@/features/release-notes/hooks/use-create-release-note'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export const AdminReleaseNotesForm = () => {
  const createMutation = useCreateReleaseNote()
  const [version, setVersion] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [publishedAt, setPublishedAt] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!version.trim() || !title.trim() || !content.trim()) {
      toast.error('Version, title, and content are required')
      return
    }
    createMutation.mutate({ version: version.trim(), title: title.trim(), content: content.trim(), publishedAt: publishedAt || undefined }, {
      onSuccess: () => {
        setContent('')
        setTitle('')
        setVersion('')
        setPublishedAt('')
      },
    })
  }

  return (
    <div className="space-y-4 rounded-md border-3 border-secondary bg-white p-4 shadow-brutal">
      <div className="flex items-center gap-2">
        <Megaphone className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">Publish Release Note</h2>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-800">Version</label>
            <Input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="v1.2.3"
              disabled={createMutation.isPending}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-800">Publish date (optional)</label>
            <Input
              type="date"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              disabled={createMutation.isPending}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-800">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What’s new in this release"
            disabled={createMutation.isPending}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-800">Content</label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="List improvements, fixes, and highlights..."
            className="min-h-[180px]"
            disabled={createMutation.isPending}
          />
          <p className="text-xs text-gray-600">This text is shown to all users until they dismiss the latest note.</p>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={createMutation.isPending} className="flex items-center gap-2">
            {createMutation.isPending ? (
              'Publishing...'
            ) : (
              <>
                <Save className="h-4 w-4" />
                Publish
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
