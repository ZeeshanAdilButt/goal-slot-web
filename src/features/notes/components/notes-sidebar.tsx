'use client'

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import toast from 'react-hot-toast'

import {
  type Announcements,
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, useSortable, type SortingStrategy } from '@dnd-kit/sortable'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, Plus, Search, Star, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Loading } from '@/components/ui/loading'
import { ConfirmDialog } from '@/components/confirm-dialog'

import {
  NOTES_QUERY_KEY,
  useCreateNoteMutation,
  useDeleteNoteMutation,
  useNotesQuery,
  useReorderNotesMutation,
  useUpdateNoteMutation,
} from '../hooks/use-notes'
import { buildNoteTree, Note } from '../utils/types'
import {
  buildReorderPayload,
  type FlatNote,
  flattenVisibleTree,
  getProjection,
  INDENTATION_WIDTH,
  type SensorContext,
  sortableTreeKeyboardCoordinates,
} from '../utils/tree-dnd'

/**
 * Notes tree sidebar — OneNote-style pages + subpages.
 *
 * Drag model: the tree renders as a single flat sortable list.
 * Dragging vertically picks the slot; dragging horizontally changes
 * the indent level, nesting the note as a subpage of the row above
 * (or un-nesting it back toward the root).
 *
 * Presentation is deliberately the calm OneNote/Atlassian style, NOT
 * the Notion collapse-into-a-line style: while dragging, no row moves
 * or changes size — the grabbed row dims in place, the moving visual
 * is exclusively the DragOverlay clone under the pointer, and a
 * floating yellow insertion line (with a dot at its left end) marks
 * the drop slot, indented to the projected level. Zero layout shift
 * until the drop commits. The dragged note's subtree tucks away for
 * the duration and follows it to the drop, which also makes dropping
 * into your own subtree impossible.
 */

const ROW_BASE_PADDING = 8

/** Collapse state — default-expanded (OneNote model), so we persist
 *  the COLLAPSED set. The legacy key persisted the expanded set for
 *  root notes only (deeper levels were always expanded); migration
 *  derives the equivalent collapsed set so nobody's sidebar changes
 *  shape on upgrade. */
const COLLAPSED_KEY = 'dw-notes-collapsed-ids'
const LEGACY_EXPANDED_KEY = 'dw-notes-expanded-ids'

const AUTO_EXPAND_HOVER_MS = 500

const measuring = { droppable: { strategy: MeasuringStrategy.Always } }

// No-displacement strategy: rows never shift or resize during a drag.
// The floating insertion line carries all the "where will it land"
// information instead (OneNote/Atlassian model — zero layout shift).
const noDisplacement: SortingStrategy = () => null

const screenReaderInstructions = {
  draggable:
    'To pick up a note, press space or enter. While dragging, use the up and down arrow keys to move it, and the left and right arrow keys to change its level in the tree. Press space or enter again to drop the note, or press escape to cancel.',
}

interface NotesSidebarProps {
  selectedNoteId: string | null
  onSelectNote: (note: Note) => void
  className?: string
}

interface NoteRowProps {
  note: FlatNote
  /** True for the row being dragged: dims in place, nothing moves. */
  isActive: boolean
  isSorting: boolean
  isSelected: boolean
  isMultiSelected: boolean
  isCollapsed: boolean
  /** Post-drop attention flash for the row that just moved. */
  flash: boolean
  onSelect: (note: Note, modifier: boolean) => void
  onToggleCollapse: (id: string) => void
  onCreateSubNote: (parentId: string) => void
  onToggleFavorite: (id: string) => void
  onDelete: (id: string) => void
}

const NoteRow = memo(function NoteRow({
  note,
  isActive,
  isSorting,
  isSelected,
  isMultiSelected,
  isCollapsed,
  flash,
  onSelect,
  onToggleCollapse,
  onCreateSubNote,
  onToggleFavorite,
  onDelete,
}: NoteRowProps) {
  // Transforms/transitions deliberately unused — rows never displace
  // during a drag (noDisplacement strategy); useSortable is here for
  // droppable registration, rect measurement, and keyboard support.
  const { attributes, listeners, setNodeRef } = useSortable({
    id: note.id,
    animateLayoutChanges: () => false,
  })

  const indentPx = ROW_BASE_PADDING + note.depth * INDENTATION_WIDTH

  const style: React.CSSProperties = {
    paddingLeft: `${indentPx}px`,
    // iOS: no text-selection loupe / share callout on long-press.
    WebkitTouchCallout: 'none',
  }

  const hasChildren = note.childCount > 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-note-id={note.id}
      {...attributes}
      {...listeners}
      onContextMenu={isSorting ? (e) => e.preventDefault() : undefined}
      className={cn(
        'group relative flex cursor-grab touch-manipulation select-none items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors duration-300',
        isSelected ? 'bg-primary text-primary-foreground' : !isSorting && 'hover:bg-zinc-50',
        isMultiSelected && !isSelected && 'bg-[#fff7d1] ring-1 ring-[#f2cc0d]/60',
        // The grabbed row dims in place; the DragOverlay clone is the
        // only thing that moves.
        isActive && 'opacity-40',
        flash && 'bg-[#fff7d1]',
        // Kill hover states + stray hit-testing under the overlay
        // while a drag is in flight.
        isSorting && 'pointer-events-none',
      )}
      onClick={(e) => onSelect(note, e.ctrlKey || e.metaKey)}
    >
      {/* Chevron — any note with subpages can collapse, at any depth
          (OneNote model). Leaf rows keep an invisible spacer so titles
          align within a level. */}
      {hasChildren ? (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleCollapse(note.id)
          }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={isCollapsed ? 'Expand subpages' : 'Collapse subpages'}
          aria-expanded={!isCollapsed}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10"
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      ) : (
        <span aria-hidden className="block h-5 w-5 shrink-0" />
      )}

      {note.icon && <span className="shrink-0 text-base">{note.icon}</span>}

      <span className="flex-1 truncate">{note.title || 'Untitled'}</span>

      {/* Quick actions: add sub-note + delete reveal on hover; the
          favorite star anchors the right edge and stays visible when
          set. Opacity + pointer-events gating avoids layout shift. */}
      <button
        type="button"
        title="Add sub-note"
        aria-label="Add sub-note"
        onClick={(e) => {
          e.stopPropagation()
          onCreateSubNote(note.id)
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className={cn(
          'pointer-events-none flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-500 opacity-0 transition-opacity hover:bg-[#fff7d1] hover:text-[#8a7307] group-hover:pointer-events-auto group-hover:opacity-100',
          isSelected && 'hover:bg-black/10',
        )}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        title="Delete note"
        aria-label="Delete note"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(note.id)
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className={cn(
          'pointer-events-none flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-500 opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-600 group-hover:pointer-events-auto group-hover:opacity-100',
          isSelected && 'hover:bg-black/10',
        )}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        aria-label={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        aria-pressed={note.isFavorite}
        onClick={(e) => {
          e.stopPropagation()
          onToggleFavorite(note.id)
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded transition-opacity hover:bg-[#fff7d1]',
          note.isFavorite
            ? 'opacity-100'
            : 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100',
          isSelected && 'hover:bg-black/10',
        )}
      >
        <Star
          className={cn(
            'h-3.5 w-3.5',
            note.isFavorite ? 'fill-current text-yellow-500' : 'text-zinc-400 hover:text-yellow-500',
          )}
        />
      </button>
    </div>
  )
})

/**
 * Floating insertion line — a 2.5px yellow line with a dot terminal,
 * absolutely positioned inside the scroll container directly below
 * the projection's insertAfterId row (or above the first row when
 * dropping at the very top), indented to the projected depth.
 * Positioned in content coordinates so autoscroll doesn't detach it
 * from its row.
 */
function DropIndicatorLine({
  containerRef,
  visible,
  insertAfterId,
  depth,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>
  visible: boolean
  insertAfterId: string | null
  depth: number
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container || !visible) {
      setPos(null)
      return
    }
    const cRect = container.getBoundingClientRect()
    let edge: number | null = null
    if (insertAfterId) {
      const el = container.querySelector<HTMLElement>(
        `[data-note-id="${window.CSS.escape(insertAfterId)}"]`,
      )
      if (el) edge = el.getBoundingClientRect().bottom
    } else {
      const first = container.querySelector<HTMLElement>('[data-note-id]')
      if (first) edge = first.getBoundingClientRect().top
    }
    if (edge === null) {
      setPos(null)
      return
    }
    setPos({
      top: edge - cRect.top + container.scrollTop,
      left: ROW_BASE_PADDING + depth * INDENTATION_WIDTH,
    })
  }, [containerRef, visible, insertAfterId, depth])

  if (!pos) return null
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-2 z-40 flex -translate-y-1/2 items-center"
      style={{ top: pos.top, left: pos.left }}
    >
      <span className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-[#f2cc0d] bg-white shadow" />
      <span className="h-[2.5px] flex-1 rounded-full bg-[#f2cc0d] shadow-[0_0_8px_rgba(242,204,13,0.6)]" />
    </div>
  )
}

export function NotesSidebar({ selectedNoteId, onSelectNote, className }: NotesSidebarProps) {
  const queryClient = useQueryClient()
  const { data: notes = [], isLoading } = useNotesQuery()
  const createMutation = useCreateNoteMutation()
  const updateMutation = useUpdateNoteMutation()
  const deleteMutation = useDeleteNoteMutation()
  const reorderMutation = useReorderNotesMutation()

  const [searchQuery, setSearchQuery] = useState('')
  const [deleteConfirmNoteId, setDeleteConfirmNoteId] = useState<string | null>(null)
  // Multi-select via Ctrl/Cmd-click; a plain click clears it.
  const [multiSelectIds, setMultiSelectIds] = useState<Set<string>>(new Set())
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)

  // ----- Collapse state (persisted) -----
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  const [collapsedLoaded, setCollapsedLoaded] = useState(false)
  const [needsLegacyMigration, setNeedsLegacyMigration] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COLLAPSED_KEY)
      if (stored != null) {
        setCollapsedIds(new Set(JSON.parse(stored)))
        setCollapsedLoaded(true)
        return
      }
    } catch {
      // Corrupt storage — fall through to migration/defaults.
    }
    setNeedsLegacyMigration(true)
  }, [])

  // One-time migration from the legacy expanded-set key: previously
  // only root notes could collapse, and did unless present in the
  // expanded set. Reproduce that exact shape as a collapsed set.
  useEffect(() => {
    if (!needsLegacyMigration || notes.length === 0) return
    let expanded = new Set<string>()
    try {
      const legacy = localStorage.getItem(LEGACY_EXPANDED_KEY)
      if (legacy) expanded = new Set(JSON.parse(legacy))
    } catch {
      // Ignore corrupt legacy state.
    }
    const hasChildren = new Set(notes.map((n) => n.parentId).filter(Boolean) as string[])
    const collapsed = new Set(
      notes
        .filter((n) => (n.parentId ?? null) === null && hasChildren.has(n.id) && !expanded.has(n.id))
        .map((n) => n.id),
    )
    setCollapsedIds(collapsed)
    setCollapsedLoaded(true)
    setNeedsLegacyMigration(false)
  }, [needsLegacyMigration, notes])

  useEffect(() => {
    if (!collapsedLoaded) return
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify(Array.from(collapsedIds)))
  }, [collapsedIds, collapsedLoaded])

  // Reveal the selected note: clear collapsed state on its ancestors.
  useEffect(() => {
    if (!selectedNoteId || notes.length === 0) return
    const byId = new Map(notes.map((n) => [n.id, n]))
    const ancestors: string[] = []
    let cur = byId.get(selectedNoteId)
    const seen = new Set<string>()
    while (cur?.parentId && !seen.has(cur.parentId)) {
      seen.add(cur.parentId)
      ancestors.push(cur.parentId)
      cur = byId.get(cur.parentId)
    }
    if (ancestors.length === 0) return
    setCollapsedIds((prev) => {
      if (!ancestors.some((id) => prev.has(id))) return prev
      const next = new Set(prev)
      ancestors.forEach((id) => next.delete(id))
      return next
    })
  }, [selectedNoteId, notes])

  const toggleCollapse = useCallback((noteId: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(noteId)) next.delete(noteId)
      else next.add(noteId)
      return next
    })
  }, [])

  // ----- Drag state -----
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  // Horizontal offset, quantized to whole indent steps so drag frames
  // between depth boundaries don't re-render anything.
  const [offsetLeft, setOffsetLeft] = useState(0)
  const offsetRef = useRef(0)
  const autoExpandTimerRef = useRef<number | null>(null)
  const autoExpandTargetRef = useRef<string | null>(null)
  // Rows we auto-expanded during THIS drag — re-collapsed on cancel,
  // left open on drop.
  const autoExpandedRef = useRef<Set<string>>(new Set())
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  // Row that just moved — briefly highlighted so the eye can follow
  // the drop.
  const [flashId, setFlashId] = useState<string | null>(null)

  const noteTree = useMemo(() => buildNoteTree(notes), [notes])
  const flattenedItems = useMemo(
    () => flattenVisibleTree(noteTree, collapsedIds, activeId),
    [noteTree, collapsedIds, activeId],
  )
  const sortedIds = useMemo(() => flattenedItems.map(({ id }) => id), [flattenedItems])
  const activeItem = activeId ? flattenedItems.find(({ id }) => id === activeId) : null

  const projected =
    activeId && overId
      ? getProjection(flattenedItems, activeId, overId, offsetLeft, INDENTATION_WIDTH)
      : null

  const sensorContext: SensorContext = useRef({ items: flattenedItems, offset: offsetLeft })
  useEffect(() => {
    sensorContext.current = { items: flattenedItems, offset: offsetLeft }
  }, [flattenedItems, offsetLeft])
  const [coordinateGetter] = useState(() =>
    sortableTreeKeyboardCoordinates(sensorContext, INDENTATION_WIDTH),
  )

  const sensors = useSensors(
    // Separate mouse/touch sensors on purpose: TouchSensor's events
    // are cancelable AFTER long-press activation, so rows can keep
    // touch-action: manipulation and the sidebar still scrolls
    // normally — the classic cause of janky touch DnD is PointerSensor
    // forcing touch-action: none everywhere.
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter }),
  )

  const clearAutoExpandTimer = useCallback(() => {
    if (autoExpandTimerRef.current != null) {
      window.clearTimeout(autoExpandTimerRef.current)
      autoExpandTimerRef.current = null
    }
    autoExpandTargetRef.current = null
  }, [])

  const resetDragState = useCallback(() => {
    setActiveId(null)
    setOverId(null)
    setOffsetLeft(0)
    offsetRef.current = 0
    clearAutoExpandTimer()
    document.body.style.cursor = ''
  }, [clearAutoExpandTimer])

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id))
    setOverId(String(active.id))
    document.body.style.cursor = 'grabbing'
  }

  const handleDragMove = ({ delta }: DragMoveEvent) => {
    const quantized = Math.round(delta.x / INDENTATION_WIDTH) * INDENTATION_WIDTH
    if (quantized !== offsetRef.current) {
      offsetRef.current = quantized
      setOffsetLeft(quantized)
    }
  }

  const handleDragOver = ({ over }: DragOverEvent) => {
    const nextOverId = over ? String(over.id) : null
    setOverId(nextOverId)

    // Hovering a collapsed parent auto-expands it after a beat, so
    // nested drop positions are reachable mid-drag.
    if (nextOverId && nextOverId !== activeId) {
      const overItem = flattenedItems.find(({ id }) => id === nextOverId)
      if (overItem && overItem.childCount > 0 && collapsedIds.has(overItem.id)) {
        if (autoExpandTargetRef.current !== overItem.id) {
          clearAutoExpandTimer()
          autoExpandTargetRef.current = overItem.id
          autoExpandTimerRef.current = window.setTimeout(() => {
            autoExpandedRef.current.add(overItem.id)
            setCollapsedIds((prev) => {
              const next = new Set(prev)
              next.delete(overItem.id)
              return next
            })
            autoExpandTimerRef.current = null
            autoExpandTargetRef.current = null
          }, AUTO_EXPAND_HOVER_MS)
        }
        return
      }
    }
    clearAutoExpandTimer()
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    // Capture render-scope values before reset.
    const finalProjection = projected
    autoExpandedRef.current = new Set()
    resetDragState()

    if (!finalProjection || !over) return

    const freshNotes = queryClient.getQueryData<Note[]>(NOTES_QUERY_KEY) ?? notes
    const payload = buildReorderPayload(freshNotes, String(active.id), finalProjection)
    if (!payload) return

    reorderMutation.mutate(payload)

    const movedId = String(active.id)
    setFlashId(movedId)
    window.setTimeout(() => setFlashId((cur) => (cur === movedId ? null : cur)), 700)

    // Keep the drop visible: the new parent must be expanded.
    if (finalProjection.parentId) {
      setCollapsedIds((prev) => {
        if (!prev.has(finalProjection.parentId!)) return prev
        const next = new Set(prev)
        next.delete(finalProjection.parentId!)
        return next
      })
    }
  }

  const handleDragCancel = () => {
    // Undo hover-triggered expansions from this drag.
    if (autoExpandedRef.current.size > 0) {
      const toRestore = autoExpandedRef.current
      setCollapsedIds((prev) => new Set([...prev, ...toRestore]))
      autoExpandedRef.current = new Set()
    }
    resetDragState()
  }

  // ----- Screen-reader announcements -----
  const titleOf = useCallback(
    (id: string | null | undefined) => {
      if (!id) return null
      const note = notes.find((n) => n.id === id)
      return note ? note.title || 'Untitled' : null
    },
    [notes],
  )

  const announcements: Announcements = {
    onDragStart({ active }) {
      return `Picked up ${titleOf(String(active.id)) ?? 'note'}.`
    },
    onDragMove() {
      return undefined
    },
    onDragOver({ active }) {
      if (!projected) return undefined
      const activeTitle = titleOf(String(active.id)) ?? 'Note'
      const parentTitle = titleOf(projected.parentId)
      return parentTitle
        ? `${activeTitle} will become a subpage of ${parentTitle}.`
        : `${activeTitle} will move to the top level.`
    },
    onDragEnd({ active }) {
      const activeTitle = titleOf(String(active.id)) ?? 'Note'
      return `${activeTitle} dropped.`
    },
    onDragCancel({ active }) {
      return `Moving ${titleOf(String(active.id)) ?? 'note'} cancelled.`
    },
  }

  // ----- CRUD handlers -----
  const handleCreateNote = useCallback(
    (parentId?: string | null) => {
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
              setCollapsedIds((prev) => {
                if (!prev.has(parentId)) return prev
                const next = new Set(prev)
                next.delete(parentId)
                return next
              })
            }
          },
        },
      )
    },
    [createMutation, onSelectNote],
  )

  const handleToggleFavorite = useCallback(
    (noteId: string) => {
      const note = (queryClient.getQueryData<Note[]>(NOTES_QUERY_KEY) ?? []).find((n) => n.id === noteId)
      if (!note) return
      updateMutation.mutate({ id: noteId, data: { isFavorite: !note.isFavorite } })
    },
    [queryClient, updateMutation],
  )

  const handleDeleteNote = useCallback((noteId: string) => {
    setDeleteConfirmNoteId(noteId)
  }, [])

  const confirmDeleteNote = async () => {
    if (!deleteConfirmNoteId) return
    const targetId = deleteConfirmNoteId
    const target = notes.find((n) => n.id === targetId)
    if (!target) {
      setDeleteConfirmNoteId(null)
      return
    }

    // Re-parent direct children to the target's parent BEFORE deleting
    // so the DB cascade doesn't take them down too — deleting a page
    // promotes its subpages one level.
    const directChildren = notes
      .filter((n) => n.parentId === targetId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    if (directChildren.length > 0) {
      try {
        await reorderMutation.mutateAsync(
          directChildren.map((child, idx) => ({
            noteId: child.id,
            parentId: target.parentId ?? null,
            order: (target.order ?? 0) + (idx + 1) * 100,
          })),
        )
      } catch {
        // If reparenting fails we still attempt the delete; the
        // cascade then takes children with the parent (server-truthful
        // behaviour, not silently lost).
      }
    }

    const snapshot = {
      title: target.title,
      content: target.content,
      icon: target.icon,
      color: target.color,
      parentId: target.parentId ?? null,
    }

    deleteMutation.mutate(targetId, {
      onSuccess: () => {
        if (selectedNoteId === targetId) {
          onSelectNote(notes.find((n) => n.id !== targetId) ?? notes[0])
        }
        toast(
          (t) => (
            <span className="flex items-center gap-3 text-sm">
              <span>Note deleted.</span>
              <button
                type="button"
                onClick={() => {
                  createMutation.mutate(snapshot)
                  toast.dismiss(t.id)
                }}
                className="rounded-md bg-[#f2cc0d] px-2 py-0.5 text-[12px] font-semibold text-zinc-900 hover:bg-[#dfb90c]"
              >
                Undo
              </button>
            </span>
          ),
          { duration: 10_000 },
        )
      },
    })
    setDeleteConfirmNoteId(null)
  }

  const handleNoteClick = useCallback(
    (note: Note, modifier: boolean) => {
      if (modifier) {
        setMultiSelectIds((prev) => {
          const next = new Set(prev)
          if (next.has(note.id)) next.delete(note.id)
          else next.add(note.id)
          return next
        })
        return
      }
      setMultiSelectIds((prev) => (prev.size > 0 ? new Set<string>() : prev))
      onSelectNote(note)
    },
    [onSelectNote],
  )

  const clearMultiSelect = () => setMultiSelectIds(new Set())

  const performBulkDelete = async () => {
    const ids = Array.from(multiSelectIds)
    if (ids.length === 0) return
    for (const id of ids) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch {
        // Continue with the rest of the batch even if one fails.
      }
    }
    if (selectedNoteId && multiSelectIds.has(selectedNoteId)) {
      const remaining = notes.find((n) => !multiSelectIds.has(n.id))
      if (remaining) onSelectNote(remaining)
    }
    setMultiSelectIds(new Set())
    setShowBulkDeleteConfirm(false)
  }

  // ----- Derived view data -----
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes
    const query = searchQuery.toLowerCase()
    return notes.filter(
      (note) => note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query),
    )
  }, [notes, searchQuery])

  const favorites = useMemo(() => notes.filter((note) => note.isFavorite), [notes])

  if (isLoading) {
    return (
      <div className={cn('flex h-full flex-col', className)}>
        <div className="flex items-center justify-center py-8">
          <Loading size="sm" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative flex h-full flex-col', className)}>
      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full rounded-md border border-zinc-200 bg-background py-1.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* New Note */}
      <div className="px-3 pb-2">
        <button
          onClick={() => handleCreateNote()}
          className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-muted hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          New Note
        </button>
      </div>

      {/* Multi-select hint / selection chip */}
      {multiSelectIds.size === 0 ? (
        <div className="hidden px-3 pb-1.5 text-[10.5px] leading-tight text-muted-foreground sm:block">
          Tip: hold <kbd className="rounded border border-zinc-200 bg-white px-1 py-0.5 font-mono text-[10px] text-zinc-700">Ctrl</kbd> /<kbd className="rounded border border-zinc-200 bg-white px-1 py-0.5 font-mono text-[10px] text-zinc-700">⌘</kbd> + click to select multiple notes. Drag to move; drag right to nest.
        </div>
      ) : (
        <div className="mx-3 mb-2 flex items-center justify-between gap-2 rounded-md border border-zinc-900 bg-zinc-900 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#f2cc0d]" />
            {multiSelectIds.size} selected
          </span>
          <span className="flex items-center gap-1">
            <button
              type="button"
              onClick={clearMultiSelect}
              className="rounded px-1.5 py-0.5 text-[10px] text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="inline-flex items-center gap-1 rounded bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white transition-colors hover:bg-rose-600"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </span>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        measuring={measuring}
        accessibility={{ announcements, screenReaderInstructions }}
        autoScroll={{ threshold: { x: 0, y: 0.2 } }}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div ref={scrollContainerRef} className="relative flex-1 overflow-y-auto overscroll-contain px-2">
          <DropIndicatorLine
            containerRef={scrollContainerRef}
            // Hidden only before any movement — once the user drags
            // (vertically OR just horizontally in place, e.g. a pure
            // indent/outdent), the line shows the landing slot,
            // including smart-outdent hops past the rest of a subtree.
            visible={!!projected && !(overId === activeId && offsetLeft === 0)}
            insertAfterId={projected ? projected.insertAfterId : null}
            depth={projected ? projected.depth : 0}
          />
          {/* Favorites */}
          {favorites.length > 0 && !searchQuery && (
            <div className="mb-4">
              <div className="mb-1 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Favorites
              </div>
              {favorites.map((note) => (
                <div
                  key={`fav-${note.id}`}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                    selectedNoteId === note.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                  )}
                  onClick={(e) => handleNoteClick(note, e.ctrlKey || e.metaKey)}
                >
                  {note.icon && <span className="text-base">{note.icon}</span>}
                  <span className="flex-1 truncate">{note.title || 'Untitled'}</span>
                  <button
                    type="button"
                    title="Remove from favorites"
                    aria-label="Remove from favorites"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleFavorite(note.id)
                    }}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors hover:bg-[#fff7d1]"
                  >
                    <Star className="h-3.5 w-3.5 fill-current text-yellow-500" />
                  </button>
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
              filteredNotes.length > 0 ? (
                filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                      selectedNoteId === note.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                    )}
                    onClick={(e) => handleNoteClick(note, e.ctrlKey || e.metaKey)}
                  >
                    {note.icon && <span className="text-base">{note.icon}</span>}
                    <span className="flex-1 truncate">{note.title || 'Untitled'}</span>
                  </div>
                ))
              ) : (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">No notes found</div>
              )
            ) : flattenedItems.length > 0 ? (
              <SortableContext items={sortedIds} strategy={noDisplacement}>
                <div className="flex flex-col gap-0.5 pb-2">
                  {flattenedItems.map((note) => (
                    <NoteRow
                      key={note.id}
                      note={note}
                      isActive={note.id === activeId}
                      isSorting={activeId !== null}
                      isSelected={selectedNoteId === note.id}
                      isMultiSelected={multiSelectIds.has(note.id)}
                      isCollapsed={collapsedIds.has(note.id)}
                      flash={note.id === flashId}
                      onSelect={handleNoteClick}
                      onToggleCollapse={toggleCollapse}
                      onCreateSubNote={handleCreateNote}
                      onToggleFavorite={handleToggleFavorite}
                      onDelete={handleDeleteNote}
                    />
                  ))}
                </div>
              </SortableContext>
            ) : (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No notes yet. Create your first note!
              </div>
            )}
          </div>
        </div>

        {/* The moving visual lives ONLY here — the source row never
            gets a transform, so nothing ever slides over other rows'
            text. Portaled to <body> so the sidebar's overflow can't
            clip it. */}
        {mounted &&
          createPortal(
            <DragOverlay dropAnimation={null}>
              {activeItem ? (
                <div className="relative flex max-w-[16rem] cursor-grabbing items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm font-medium text-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.18),0_0_0_2px_rgba(242,204,13,0.4)]">
                  {activeItem.icon && <span className="shrink-0 text-base">{activeItem.icon}</span>}
                  <span className="flex-1 truncate">{activeItem.title || 'Untitled'}</span>
                  {activeItem.descendantCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#f2cc0d] px-1 text-[10px] font-bold text-zinc-900 shadow">
                      {activeItem.descendantCount + 1}
                    </span>
                  )}
                </div>
              ) : null}
            </DragOverlay>,
            document.body,
          )}
      </DndContext>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteConfirmNoteId}
        onOpenChange={(open) => !open && setDeleteConfirmNoteId(null)}
        title="Delete Note"
        description="Delete this note? Its subpages will move up one level."
        onConfirm={confirmDeleteNote}
        confirmButtonText="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />

      {/* Bulk delete confirmation */}
      <ConfirmDialog
        open={showBulkDeleteConfirm}
        onOpenChange={(open) => !open && setShowBulkDeleteConfirm(false)}
        title={`Delete ${multiSelectIds.size} notes?`}
        description="Each note and all its subpages will be deleted. This action cannot be undone."
        onConfirm={performBulkDelete}
        confirmButtonText={`Delete ${multiSelectIds.size}`}
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />

      {/* Floating multi-select action bar */}
      {multiSelectIds.size > 0 && (
        <div className="pointer-events-auto sticky bottom-2 z-30 mx-2 mb-1 flex items-center justify-between gap-2 rounded-lg border border-zinc-900 bg-zinc-900 px-2.5 py-2 text-[12px] font-semibold text-white shadow-lg">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#f2cc0d]" />
            {multiSelectIds.size} selected
          </span>
          <span className="flex items-center gap-1">
            <button
              type="button"
              onClick={clearMultiSelect}
              className="rounded px-2 py-1 text-[11px] text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="inline-flex items-center gap-1 rounded bg-rose-500 px-2 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-rose-600"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </span>
        </div>
      )}
    </div>
  )
}
