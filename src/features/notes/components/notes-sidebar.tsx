'use client'

import { useState, useMemo } from 'react'

import {
  ChevronRight,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Trash2,
  Pencil,
  Star,
  StarOff,
  FileText,
  FolderPlus,
  Search,
} from 'lucide-react'

import {
  Note,
  NoteTreeItem,
  buildNoteTree,
  NOTE_ICONS,
} from '../utils/types'
import { useNotesQuery, useCreateNoteMutation, useUpdateNoteMutation, useDeleteNoteMutation } from '../hooks/use-notes'

import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface NotesSidebarProps {
  selectedNoteId: string | null
  onSelectNote: (note: Note) => void
  className?: string
}

export function NotesSidebar({ selectedNoteId, onSelectNote, className }: NotesSidebarProps) {
  const { data: notes = [], isLoading } = useNotesQuery()
  const createMutation = useCreateNoteMutation()
  const updateMutation = useUpdateNoteMutation()
  const deleteMutation = useDeleteNoteMutation()

  const [searchQuery, setSearchQuery] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [contextMenuNoteId, setContextMenuNoteId] = useState<string | null>(null)
  const [deleteConfirmNoteId, setDeleteConfirmNoteId] = useState<string | null>(null)

  // Build tree structure
  const noteTree = useMemo(() => buildNoteTree(notes), [notes])

  // Filter notes based on search
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes
    const query = searchQuery.toLowerCase()
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
    )
  }, [notes, searchQuery])

  // Get favorites
  const favorites = useMemo(
    () => notes.filter((note) => note.isFavorite),
    [notes]
  )

  const toggleExpanded = (noteId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(noteId)) {
        next.delete(noteId)
      } else {
        next.add(noteId)
      }
      return next
    })
  }

  const handleCreateNote = (parentId?: string | null) => {
    createMutation.mutate(
      {
        title: 'Untitled',
        content: '[]',
        parentId: parentId || null,
      },
      {
        onSuccess: (newNote) => {
          onSelectNote(newNote)
          if (parentId) {
            setExpandedIds((prev) => new Set([...prev, parentId]))
          }
        },
      }
    )
  }

  const handleToggleFavorite = (note: Note) => {
    updateMutation.mutate({
      id: note.id,
      data: { isFavorite: !note.isFavorite },
    })
  }

  const handleDeleteNote = (noteId: string) => {
    setDeleteConfirmNoteId(noteId)
    setContextMenuNoteId(null)
  }

  const confirmDeleteNote = () => {
    if (!deleteConfirmNoteId) return
    deleteMutation.mutate(deleteConfirmNoteId, {
      onSuccess: () => {
        if (selectedNoteId === deleteConfirmNoteId) {
          onSelectNote(notes[0])
        }
      },
    })
  }

  const renderNoteItem = (note: NoteTreeItem, depth = 0) => {
    const hasChildren = note.children.length > 0
    const isExpanded = expandedIds.has(note.id)
    const isSelected = selectedNoteId === note.id

    return (
      <div key={note.id}>
        <div
          className={cn(
            'group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors cursor-pointer',
            isSelected
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => onSelectNote(note)}
        >
          {/* Expand/Collapse button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleExpanded(note.id)
            }}
            className={cn(
              'flex h-5 w-5 shrink-0 items-center justify-center rounded',
              hasChildren ? 'hover:bg-black/10 dark:hover:bg-white/10' : 'invisible'
            )}
          >
            {hasChildren && (
              isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )
            )}
          </button>

          {/* Icon */}
          <span className="shrink-0 text-base">{note.icon || '📄'}</span>

          {/* Title */}
          <span className="flex-1 truncate">{note.title || 'Untitled'}</span>

          {/* Favorite indicator */}
          {note.isFavorite && (
            <Star className="h-3.5 w-3.5 shrink-0 fill-current text-yellow-500" />
          )}

          {/* Actions */}
          <Popover
            open={contextMenuNoteId === note.id}
            onOpenChange={(open) => setContextMenuNoteId(open ? note.id : null)}
          >
            <PopoverTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setContextMenuNoteId(note.id)
                }}
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 group-hover:opacity-100',
                  isSelected ? 'hover:bg-black/10' : 'hover:bg-muted'
                )}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" align="start">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleCreateNote(note.id)
                  setContextMenuNoteId(null)
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
              >
                <FolderPlus className="h-4 w-4" />
                Add sub-note
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleFavorite(note)
                  setContextMenuNoteId(null)
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
              >
                {note.isFavorite ? (
                  <>
                    <StarOff className="h-4 w-4" />
                    Remove from favorites
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4" />
                    Add to favorites
                  </>
                )}
              </button>
              <hr className="my-1 border-border" />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteNote(note.id)
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </PopoverContent>
          </Popover>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {note.children.map((child) => renderNoteItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={cn('flex h-full flex-col', className)}>
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full rounded-md border-2 border-border bg-background py-1.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* New Note button */}
      <div className="px-3 pb-2">
        <button
          onClick={() => handleCreateNote()}
          className="flex w-full items-center gap-2 rounded-md border-2 border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-muted hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          New Note
        </button>
      </div>

      {/* Notes tree */}
      <div className="flex-1 overflow-y-auto px-2">
        {/* Favorites section */}
        {favorites.length > 0 && !searchQuery && (
          <div className="mb-4">
            <div className="mb-1 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Favorites
            </div>
            {favorites.map((note) => (
              <div
                key={`fav-${note.id}`}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors cursor-pointer',
                  selectedNoteId === note.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
                onClick={() => onSelectNote(note)}
              >
                <span className="text-base">{note.icon || '📄'}</span>
                <span className="flex-1 truncate">{note.title || 'Untitled'}</span>
                <Star className="h-3.5 w-3.5 shrink-0 fill-current text-yellow-500" />
              </div>
            ))}
          </div>
        )}

        {/* All notes / Search results */}
        <div>
          <div className="mb-1 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {searchQuery ? 'Search Results' : 'All Notes'}
          </div>
          {searchQuery ? (
            // Flat list for search results
            filteredNotes.length > 0 ? (
              filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors cursor-pointer',
                    selectedNoteId === note.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                  onClick={() => onSelectNote(note)}
                >
                  <span className="text-base">{note.icon || '📄'}</span>
                  <span className="flex-1 truncate">{note.title || 'Untitled'}</span>
                </div>
              ))
            ) : (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No notes found
              </div>
            )
          ) : (
            // Tree view for normal display
            noteTree.length > 0 ? (
              noteTree.map((note) => renderNoteItem(note))
            ) : (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No notes yet. Create your first note!
              </div>
            )
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteConfirmNoteId}
        onOpenChange={(open) => !open && setDeleteConfirmNoteId(null)}
        title="Delete Note"
        description="Delete this note and all its children? This action cannot be undone."
        onConfirm={confirmDeleteNote}
        confirmButtonText="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
