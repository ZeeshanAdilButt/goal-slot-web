'use client'

import { useEffect, useMemo, useState, useRef } from 'react'

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  closestCenter,
  MeasuringStrategy,
} from '@dnd-kit/core'

import {
  ChevronDown,
  ChevronRight,
  FileText,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Star,
  StarOff,
  Trash2,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ConfirmDialog } from '@/components/confirm-dialog'

import { useCreateNoteMutation, useDeleteNoteMutation, useNotesQuery, useUpdateNoteMutation, useReorderNotesMutation } from '../hooks/use-notes'
import { buildNoteTree, Note, NOTE_ICONS, NoteTreeItem } from '../utils/types'

interface NotesSidebarProps {
  selectedNoteId: string | null
  onSelectNote: (note: Note) => void
  className?: string
}

type DropPosition = 'top' | 'inside' | 'bottom' | null

interface NoteItemProps {
  note: NoteTreeItem
  depth: number
  isExpanded: boolean
  isSelected: boolean
  expandedIds: Set<string>
  onSelect: (note: Note) => void
  onToggleExpand: (id: string, e: React.MouseEvent) => void
  onCreateSubNote: (parentId: string) => void
  onToggleFavorite: (note: Note) => void
  onDelete: (id: string) => void
  onHoverStateChange: (id: string, position: DropPosition) => void
  className?: string
}

function NoteItem({
  note,
  depth,
  isExpanded,
  isSelected,
  expandedIds,
  onSelect,
  onToggleExpand,
  onCreateSubNote,
  onToggleFavorite,
  onDelete,
  onHoverStateChange,
  className,
}: NoteItemProps) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: note.id,
    data: note,
  })

  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: note.id,
    data: note,
  })

  const [dropPosition, setDropPosition] = useState<DropPosition>(null)
  const elementRef = useRef<HTMLDivElement | null>(null)

  // Combine refs
  const setRef = (node: HTMLDivElement | null) => {
    setNodeRef(node)
    setDroppableRef(node)
    elementRef.current = node
  }

  // Handle drop position detection
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isOver || !elementRef.current) return

    const rect = elementRef.current.getBoundingClientRect()
    const y = e.clientY - rect.top
    const height = rect.height
    
    let position: DropPosition = 'inside'

    if (y < height * 0.25) {
      position = 'top'
    } else if (y > height * 0.75) {
      position = 'bottom'
    }

    if (position !== dropPosition) {
        setDropPosition(position)
        onHoverStateChange(note.id, position)
    }
  }

  useEffect(() => {
    if (!isOver) {
      setDropPosition(null)
      // We don't clear global state here because dragEnd happens after isOver might be cleared? 
      // Actually standard dnd-kit flow keeps isOver true until drop.
    }
  }, [isOver])

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 999 : 'auto',
  } : undefined

  // Recursive render helper for children
  const hasChildren = note.children.length > 0
  
  return (
    <div className={className}>
      <div
        ref={setRef}
        style={{ 
          paddingLeft: `${depth * 12 + 8}px`,
          ...style 
        }}
        {...attributes}
        {...listeners}
        onMouseMove={handleMouseMove}
        className={cn(
          'group relative flex items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors cursor-pointer select-none',
          isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
          isOver && dropPosition === 'inside' && 'bg-primary/20 ring-2 ring-primary ring-inset',
        )}
        onClick={() => onSelect(note)}
      >
        {/* Drop Indicators */}
        {isOver && dropPosition === 'top' && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary z-50 pointer-events-none" />
        )}
        {isOver && dropPosition === 'bottom' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary z-50 pointer-events-none" />
        )}

        {/* Expand/Collapse button */}
        <button
          onClick={(e) => onToggleExpand(note.id, e)}
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded',
            hasChildren ? 'hover:bg-black/10 dark:hover:bg-white/10' : 'invisible',
          )}
        >
          {hasChildren &&
            (isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />)}
        </button>

        {/* Icon */}
        <span className="shrink-0 text-base">{note.icon || '📄'}</span>

        {/* Title */}
        <span className="flex-1 truncate">{note.title || 'Untitled'}</span>

        {/* Favorite indicator */}
        {note.isFavorite && <Star className="h-3.5 w-3.5 shrink-0 fill-current text-yellow-500" />}

        {/* Actions */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              onClick={(e) => {
                e.stopPropagation() 
              }}
              onPointerDown={(e) => e.stopPropagation()} 
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 group-hover:opacity-100',
                isSelected ? 'hover:bg-black/10' : 'hover:bg-muted',
              )}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1" align="start">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCreateSubNote(note.id)
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
              >
                  <FolderPlus className="h-4 w-4" />
                  Add sub-note
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFavorite(note)
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
                  onDelete(note.id)
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
          {note.children.map((child) => (
            <NoteItem
              key={child.id}
              note={child}
              depth={depth + 1}
              isExpanded={expandedIds.has(child.id)}
              isSelected={false} // Only highlighting direct selection in recursive render is limiting, better fix in parent
              expandedIds={expandedIds} 
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onCreateSubNote={onCreateSubNote}
              onToggleFavorite={onToggleFavorite}
              onDelete={onDelete}
              onHoverStateChange={onHoverStateChange}
              className={className} 
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function NotesSidebar({ selectedNoteId, onSelectNote, className }: NotesSidebarProps) {
  const { data: notes = [], isLoading } = useNotesQuery()
  const createMutation = useCreateNoteMutation()
  const updateMutation = useUpdateNoteMutation()
  const deleteMutation = useDeleteNoteMutation()
  const reorderMutation = useReorderNotesMutation()

  const [searchQuery, setSearchQuery] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [contextMenuNoteId, setContextMenuNoteId] = useState<string | null>(null)
  const [deleteConfirmNoteId, setDeleteConfirmNoteId] = useState<string | null>(null)
  
  // Initialize expandedIds from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('dw-notes-expanded-ids')
      if (stored) {
        setExpandedIds(new Set(JSON.parse(stored)))
      }
    } catch (e) {
      console.error('Failed to parse expanded ids from local storage', e)
    }
  }, [])

  // Sync expandedIds to localStorage
  useEffect(() => {
    if (expandedIds.size > 0) {
      localStorage.setItem('dw-notes-expanded-ids', JSON.stringify(Array.from(expandedIds)))
    }
  }, [expandedIds])

  // Build tree structure
  const noteTree = useMemo(() => buildNoteTree(notes), [notes])

  // Filter notes based on search
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes
    const query = searchQuery.toLowerCase()
    return notes.filter(
      (note) => note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query),
    )
  }, [notes, searchQuery])

  // Get favorites
  const favorites = useMemo(() => notes.filter((note) => note.isFavorite), [notes])

  // Auto-expand parents of selected note
  useEffect(() => {
    if (selectedNoteId && notes.length > 0) {
      const parentsToExpand = new Set<string>()
      
      let currentNote = notes.find((n) => n.id === selectedNoteId)
      // Traverse up to find all parents
      while (currentNote?.parentId) {
        parentsToExpand.add(currentNote.parentId)
        const parentId = currentNote.parentId
        currentNote = notes.find((n) => n.id === parentId)
      }
      
      if (parentsToExpand.size > 0) {
        setExpandedIds((prev) => {
           // check if all are already expanded to avoid loop/re-render if possible
           let needsUpdate = false
           for (const id of Array.from(parentsToExpand)) {
             if (!prev.has(id)) {
               needsUpdate = true
               break
             }
           }
           
           if (!needsUpdate) return prev
           
           return new Set([...prev, ...Array.from(parentsToExpand)])
        })
      }
    }
  }, [selectedNoteId, notes])

  const toggleExpanded = (noteId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
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

  // DnD Logic
  const activeNote = useRef<NoteTreeItem | null>(null)
  
  const dragStateRef = useRef<{ id: string, position: DropPosition }>({ id: '', position: null })
  
  const handleItemHoverStateChange = (id: string, position: DropPosition) => {
      dragStateRef.current = { id, position }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    // Find the note object (expensive but safe)
    const findNote = (items: NoteTreeItem[], id: string): NoteTreeItem | null => {
        for (const item of items) {
            if (item.id === id) return item
            if (item.children.length) {
                const found = findNote(item.children, id)
                if (found) return found
            }
        }
        return null
    }
    const note = findNote(noteTree, active.id as string)
    activeNote.current = note
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    activeNote.current = null

    if (!over || active.id === over.id) return

    // Logic for reparenting/reordering
    const { id: hoverId, position } = dragStateRef.current
    
    // Safety check: ensure we are hovering the correct item or at least 'over' matches
    // Note: over.id might be bubbling? No, standard usage.
    if (!position || hoverId !== over.id) {
         // Fallback if hover state is desynced: treat as 'inside' if directly over
         if (over.id) {
             // Default to reparenting if dropping on top of something
             reorderMutation.mutate([{
                 noteId: active.id as string,
                 parentId: over.id as string,
                 order: 99999 // Append to end
             }])
         }
         return
    }

    // Handle position-based drag and drop
    const noteId = active.id as string
    const targetId = over.id as string
    const targetNote = notes.find((n: Note) => n.id === targetId)
    
    if (!targetNote) return

    if (position === 'inside') {
      // Reparent: make the dragged note a child of the target
      reorderMutation.mutate([{
        noteId,
        parentId: targetId,
        order: 99999
      }])
    } else {
      // top or bottom: reorder among siblings
      const siblings = notes.filter((n: Note) => n.parentId === targetNote.parentId)
      const noteToMove = notes.find((n: Note) => n.id === noteId)
      if (!noteToMove) return
      
      const newSiblings = [...siblings]
      const activeIndex = newSiblings.findIndex((n: Note) => n.id === noteId)
      if (activeIndex >= 0) {
        newSiblings.splice(activeIndex, 1)
      }
      
      const targetIndex = newSiblings.findIndex((n: Note) => n.id === targetId)
      const insertionIndex = position === 'top' ? targetIndex : targetIndex + 1
      newSiblings.splice(insertionIndex, 0, noteToMove)
      
      const updates = newSiblings.map((n: Note, index: number) => ({
        noteId: n.id,
        parentId: targetNote.parentId,
        order: (index + 1) * 1000
      }))
      
      reorderMutation.mutate(updates)
    }
  }

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
  )

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
      },
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
    return (
      <NoteItem
        key={note.id}
        note={note}
        depth={depth}
        isExpanded={expandedIds.has(note.id)}
        isSelected={selectedNoteId === note.id}
        expandedIds={expandedIds}
        onSelect={onSelectNote}
        onToggleExpand={toggleExpanded}
        onCreateSubNote={handleCreateNote}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDeleteNote}
        onHoverStateChange={handleItemHoverStateChange}
      />
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
          disabled={createMutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createMutation.isPending ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              New Note
            </>
          )}
        </button>
      </div>

      {/* Notes tree */}
      <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          measuring={{
             droppable: {
                strategy: MeasuringStrategy.Always,
             }
          }}
      >
        <div className="flex-1 overflow-y-auto px-2">
            {/* Favorites section */}
            {favorites.length > 0 && !searchQuery && (
            <div className="mb-4">
                <div className="mb-1 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Favorites</div>
                {favorites.map((note) => (
                <div
                    key={`fav-${note.id}`}
                    className={cn(
                    'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors cursor-pointer',
                    selectedNoteId === note.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
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
                // Flat list for search results - No DnD in search view for now
                filteredNotes.length > 0 ? (
                filteredNotes.map((note) => (
                    <div
                    key={note.id}
                    className={cn(
                        'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors cursor-pointer',
                        selectedNoteId === note.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                    )}
                    onClick={() => onSelectNote(note)}
                    >
                    <span className="text-base">{note.icon || '📄'}</span>
                    <span className="flex-1 truncate">{note.title || 'Untitled'}</span>
                    </div>
                ))
                ) : (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">No notes found</div>
                )
            ) : // Tree view for normal display
            noteTree.length > 0 ? (
                // Wrap in explicit container div although items are already blocked
                <div className="flex flex-col gap-0.5">
                    {noteTree.map((note) => renderNoteItem(note))}
                </div>
            ) : (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No notes yet. Create your first note!
                </div>
            )}
            </div>
        </div>

        <DragOverlay>
            {activeNote.current ? (
            <div className="flex items-center gap-1 rounded-md bg-background px-2 py-1.5 text-sm shadow-xl border border-border opacity-90 cursor-grabbing">
                <span className="shrink-0 text-base">{activeNote.current.icon || '📄'}</span>
                <span className="flex-1 truncate">{activeNote.current.title || 'Untitled'}</span>
            </div>
            ) : null}
        </DragOverlay>
      </DndContext>

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
