'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { Check, Copy, Download, Link as LinkIcon, MoreHorizontal, Star, StarOff, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { TiptapEditor } from '@/components/tiptap-editor'

import { useDeleteNoteMutation, useUpdateNoteMutation } from '../hooks/use-notes'
import { Note, NOTE_COLORS, NOTE_ICONS } from '../utils/types'

// Convert old block-based JSON content to HTML
function convertOldContentToHtml(content: string): string {
  if (!content) return '<p></p>'

  // If it's already HTML (starts with < and not JSON), return as-is
  if (content.trim().startsWith('<')) {
    return content
  }

  // Try to parse as JSON (old block format)
  try {
    const blocks = JSON.parse(content)
    if (!Array.isArray(blocks)) {
      return `<p>${content}</p>`
    }

    return blocks
      .map((block: any) => {
        const blockContent = block.content || ''
        switch (block.type) {
          case 'heading1':
            return `<h1>${blockContent}</h1>`
          case 'heading2':
            return `<h2>${blockContent}</h2>`
          case 'heading3':
            return `<h3>${blockContent}</h3>`
          case 'bulletList':
            return `<ul><li>${blockContent}</li></ul>`
          case 'numberedList':
            return `<ol><li>${blockContent}</li></ol>`
          case 'todoList':
          case 'todo':
            const checked = block.checked ? 'checked' : ''
            return `<ul data-type="taskList"><li data-type="taskItem" data-checked="${block.checked || false}"><label><input type="checkbox" ${checked}><span></span></label><div>${blockContent}</div></li></ul>`
          case 'quote':
          case 'blockquote':
            return `<blockquote>${blockContent}</blockquote>`
          case 'code':
          case 'codeBlock':
            return `<pre><code>${blockContent}</code></pre>`
          case 'divider':
            return '<hr>'
          case 'image':
            return block.url ? `<img src="${block.url}" alt="${block.alt || ''}" />` : ''
          case 'toggleList':
            return `<details><summary>${block.title || ''}</summary><p>${blockContent}</p></details>`
          case 'paragraph':
          default:
            return blockContent ? `<p>${blockContent}</p>` : '<p></p>'
        }
      })
      .join('')
  } catch {
    // If JSON parse fails, treat as plain text
    return `<p>${content}</p>`
  }
}

// Custom debounce hook
function useDebounce<T extends (...args: any[]) => void>(callback: T, delay: number): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const callbackRef = useRef(callback)

  // Update the callback ref on every render
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    [delay],
  ) as T
}

interface NoteEditorProps {
  note: Note
  onDelete?: () => void
}

export function NoteEditor({ note, onDelete }: NoteEditorProps) {
  const updateMutation = useUpdateNoteMutation()
  const deleteMutation = useDeleteNoteMutation()
  const [title, setTitle] = useState(note.title)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const isInitialized = useRef(false)
  const noteIdRef = useRef(note.id)
  const [editorContent, setEditorContent] = useState(() => convertOldContentToHtml(note.content || ''))

  // Update when note changes
  useEffect(() => {
    setTitle(note.title)
    setEditorContent(convertOldContentToHtml(note.content || ''))
    isInitialized.current = true
    noteIdRef.current = note.id
  }, [note.id, note.title, note.content])

  // Debounced auto-save for title
  const saveTitle = useCallback(
    (newTitle: string) => {
      if (newTitle !== note.title) {
        updateMutation.mutate({ id: noteIdRef.current, data: { title: newTitle } })
      }
    },
    [note.title, updateMutation],
  )

  const debouncedSaveTitle = useDebounce(saveTitle, 500)

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    debouncedSaveTitle(newTitle)
  }

  // Handle content change
  const saveContent = useCallback(
    (html: string) => {
      if (!isInitialized.current) return
      updateMutation.mutate({ id: noteIdRef.current, data: { content: html } })
    },
    [updateMutation],
  )

  const debouncedSaveContent = useDebounce(saveContent, 1000)

  const handleContentChange = useCallback(
    (html: string, _json?: any) => {
      setEditorContent(html)
      debouncedSaveContent(html)
    },
    [debouncedSaveContent],
  )

  // Handle icon change
  const handleIconChange = (icon: string) => {
    updateMutation.mutate({ id: note.id, data: { icon } })
    setShowIconPicker(false)
  }

  // Handle color change
  const handleColorChange = (color: string) => {
    updateMutation.mutate({ id: note.id, data: { color } })
    setShowColorPicker(false)
  }

  // Toggle favorite
  const handleToggleFavorite = () => {
    updateMutation.mutate({ id: note.id, data: { isFavorite: !note.isFavorite } })
  }

  // Delete note
  const handleDelete = () => {
    setShowDeleteConfirm(true)
    setShowMenu(false)
  }

  const confirmDelete = () => {
    deleteMutation.mutate(note.id, {
      onSuccess: () => {
        onDelete?.()
      },
    })
  }

  // Copy note link
  const handleCopyLink = () => {
    const link = `${window.location.origin}/dashboard/notes/${note.id}`
    navigator.clipboard.writeText(link)
    setCopySuccess('link')
    setTimeout(() => setCopySuccess(null), 2000)
    setShowMenu(false)
  }

  // Copy as HTML
  const handleCopyHTML = () => {
    navigator.clipboard.writeText(editorContent)
    setCopySuccess('html')
    setTimeout(() => setCopySuccess(null), 2000)
    setShowMenu(false)
  }

  // Export as HTML file
  const handleExportHTML = () => {
    const fullHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title || 'Note'}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }
    h1 { font-size: 2em; margin-bottom: 0.5em; }
    h2 { font-size: 1.5em; margin-top: 1.5em; }
    h3 { font-size: 1.2em; margin-top: 1.2em; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; }
    pre { background: #1e1e1e; color: #fff; padding: 16px; border-radius: 8px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 16px; color: #666; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f4f4f4; }
    ul.task-list { list-style: none; padding-left: 0; }
    li.task-item { display: flex; align-items: flex-start; gap: 8px; }
    li.task-item input { margin-top: 4px; }
  </style>
</head>
<body>
  <h1>${title || 'Untitled'}</h1>
  ${editorContent}
</body>
</html>`
    const blob = new Blob([fullHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'note'}.html`
    a.click()
    URL.revokeObjectURL(url)
    setShowMenu(false)
  }

  // Get current color styles
  const colorConfig = NOTE_COLORS.find((c) => c.value === note.color) || NOTE_COLORS[0]

  return (
    <div className={cn('flex h-full flex-col', colorConfig.bg)}>
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b-2 border-border px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {/* Icon picker */}
          <Popover open={showIconPicker} onOpenChange={setShowIconPicker}>
            <PopoverTrigger asChild>
              <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-border bg-card text-2xl transition-colors hover:bg-muted">
                {note.icon || '📄'}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <div className="grid grid-cols-8 gap-1">
                {NOTE_ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => handleIconChange(icon)}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-muted',
                      note.icon === icon && 'bg-primary text-primary-foreground',
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Title input */}
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled"
            className="min-w-0 flex-1 bg-transparent text-xl font-bold outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Copy success indicator */}
          {copySuccess && (
            <div className="flex items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
              <Check className="h-3 w-3" />
              Copied!
            </div>
          )}

          {/* Favorite button */}
          <button
            onClick={handleToggleFavorite}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg border-2 border-border transition-colors',
              note.isFavorite
                ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400'
                : 'bg-card hover:bg-muted',
            )}
            title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {note.isFavorite ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
          </button>

          {/* Color picker */}
          <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
            <PopoverTrigger asChild>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-border bg-card transition-colors hover:bg-muted"
                title="Change color"
              >
                <div className={cn('h-5 w-5 rounded-full border-2', colorConfig.border, colorConfig.bg)} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="end">
              <div className="grid grid-cols-4 gap-2">
                {NOTE_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleColorChange(color.value)}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all',
                      color.border,
                      color.bg,
                      note.color === color.value && 'ring-2 ring-primary ring-offset-2',
                    )}
                    title={color.label}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* More options */}
          <Popover open={showMenu} onOpenChange={setShowMenu}>
            <PopoverTrigger asChild>
              <button className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-border bg-card transition-colors hover:bg-muted">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-1" align="end">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Copy</div>
              <button
                onClick={handleCopyLink}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
              >
                <LinkIcon className="h-4 w-4" />
                Copy link
              </button>
              <button
                onClick={handleCopyHTML}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
              >
                <Copy className="h-4 w-4" />
                Copy content
              </button>
              <hr className="my-1 border-border" />
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Export</div>
              <button
                onClick={handleExportHTML}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
              >
                <Download className="h-4 w-4" />
                Download as .html
              </button>
              <hr className="my-1 border-border" />
              <button
                onClick={handleDelete}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                Delete note
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Content - Tiptap Editor */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="h-full px-4 py-2">
          <TiptapEditor
            key={note.id}
            content={editorContent}
            onChange={handleContentChange}
            placeholder="Start typing... Use '/' for commands"
            className="h-full"
          />
        </div>
      </div>

      {/* Footer with metadata */}
      <div className="flex shrink-0 items-center justify-between border-t border-border/50 px-4 py-2 text-xs text-muted-foreground">
        <span>Created: {new Date(note.createdAt).toLocaleDateString()}</span>
        <span>Last updated: {new Date(note.updatedAt).toLocaleString()}</span>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Note"
        description="Delete this note? This cannot be undone."
        onConfirm={confirmDelete}
        confirmButtonText="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
