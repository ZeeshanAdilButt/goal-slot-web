'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import toast from 'react-hot-toast'

import {
  closestCenter,
  type CollisionDetection,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  MeasuringStrategy,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useQueryClient } from '@tanstack/react-query'
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
import { Loading } from '@/components/ui/loading'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ConfirmDialog } from '@/components/confirm-dialog'

import {
  NOTES_QUERY_KEY,
  useCreateNoteMutation,
  useDeleteNoteMutation,
  useNotesQuery,
  useReorderNotesMutation,
  useUpdateNoteMutation,
} from '../hooks/use-notes'
import { buildNoteTree, Note, NOTE_ICONS, NoteTreeItem } from '../utils/types'

// Walks the flat note list (parent → children) and collects every
// descendant id of `noteId`. Used by the cycle guard so we never let a
// note become its own grand-…-child (which would orphan its subtree
// once `buildNoteTree` re-runs and silently looked like "nothing
// moved" in the sidebar). O(n) — cheap relative to a drag interaction.
function findDescendantIds(noteId: string, notes: Note[]): Set<string> {
  const childrenByParent = new Map<string, Note[]>()
  for (const n of notes) {
    const pid = n.parentId ?? null
    if (pid === null) continue
    const list = childrenByParent.get(pid) ?? []
    list.push(n)
    childrenByParent.set(pid, list)
  }
  const out = new Set<string>()
  const stack: string[] = [noteId]
  while (stack.length) {
    const cur = stack.pop()!
    const kids = childrenByParent.get(cur)
    if (!kids) continue
    for (const k of kids) {
      if (out.has(k.id)) continue
      out.add(k.id)
      stack.push(k.id)
    }
  }
  return out
}

// Custom collision detection: prefer the droppable directly under the
// pointer (more intuitive for tree drops), fall back to nearest-center
// only when the pointer is outside every droppable rect (e.g. the user
// has drifted into the sidebar's padding). Mirrors the dnd-kit
// recommendation for sortable trees.
const notesCollision: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args)
  if (pointerHits.length > 0) return pointerHits
  return closestCenter(args)
}

interface NotesSidebarProps {
  selectedNoteId: string | null
  onSelectNote: (note: Note) => void
  className?: string
}

/**
 * OneNote-pure drop model: every drag is a sibling reorder.
 *   - top half of the target row    → drop ABOVE (previous sibling)
 *   - bottom half of the target row → drop BELOW (next sibling)
 *
 * There is NO drag-to-nest zone. OneNote itself doesn't have one
 * (it uses right-click → Make Sub Page); ours uses the per-row
 * "+ sub-note" button. A middle "inside" zone made the most common
 * gesture (move within a parent) feel broken because hovering near
 * the middle of a row turned a sibling-reorder into a nesting drop.
 *
 * To un-nest a deeply nested note, drag it onto any other note at
 * the desired depth (it'll join their parent), or onto the dedicated
 * root-drop zones at the very top / bottom of the tree.
 */
type DropZone = 'above' | 'below'

interface DropTarget {
  /** dnd-kit droppable id — usually a note id, or one of ROOT_TOP_ID / ROOT_BOTTOM_ID. */
  id: string
  zone: DropZone
}

/** Synthetic droppable ids for the "drop as first/last root note" zones. */
const ROOT_TOP_ID = '__root_top__'
const ROOT_BOTTOM_ID = '__root_bottom__'

/** Auto-expand a collapsed target after the pointer has hovered its
 *  inside-zone for this many ms. Matches Notion / Linear cadence. */
const AUTO_EXPAND_HOVER_MS = 600

/**
 * Decide the drop zone from where the pointer is inside the target's
 * bounding rect. Strict 50/50 split — top half goes above, bottom
 * half goes below. No middle zone, no fuzz factor; predictability
 * matters more than "almost any drop counts".
 */
function zoneFromPointer(pointerY: number, rect: DOMRect): DropZone {
  if (rect.height <= 0) return 'above'
  return pointerY < rect.top + rect.height / 2 ? 'above' : 'below'
}

/**
 * Resolve the *effective* drop target after applying the "drop below an
 * expanded parent with children = drop above its first child" tree-DnD
 * convention. Gives users a much larger target area for "make X the first
 * child of Y" than the thin top half of the current first child row, and
 * avoids the failure mode where pointer drift onto the parent's bottom
 * half drops the note as a sibling-after-parent instead.
 */
function resolveDropTarget(
  notes: Note[],
  overId: string,
  rawZone: DropZone,
  draggedNoteId: string,
  expandedIds: Set<string>,
): DropTarget {
  if (overId === ROOT_TOP_ID || overId === ROOT_BOTTOM_ID) {
    return { id: overId, zone: rawZone }
  }
  if (rawZone !== 'below') return { id: overId, zone: rawZone }
  if (!expandedIds.has(overId)) return { id: overId, zone: rawZone }
  const firstChild = notes
    .filter((n) => n.parentId === overId && n.id !== draggedNoteId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0]
  if (!firstChild) return { id: overId, zone: rawZone }
  return { id: firstChild.id, zone: 'above' }
}

interface NoteItemProps {
  note: NoteTreeItem
  depth: number
  isExpanded: boolean
  isSelected: boolean
  isMultiSelected: boolean
  expandedIds: Set<string>
  onSelect: (note: Note, modifier: boolean) => void
  onToggleExpand: (id: string, e: React.MouseEvent) => void
  onCreateSubNote: (parentId: string) => void
  onToggleFavorite: (note: Note) => void
  onDelete: (id: string) => void
  multiSelectIds: Set<string>
  /** Global active drop target (forwarded down so recursive children
   *  can each decide if THEY are the target). null when no drag. */
  activeDropTarget: DropTarget | null
  className?: string
}

function NoteItem({
  note,
  depth,
  isExpanded,
  isSelected,
  isMultiSelected,
  expandedIds,
  onSelect,
  onToggleExpand,
  onCreateSubNote,
  onToggleFavorite,
  onDelete,
  multiSelectIds,
  activeDropTarget,
  className,
}: NoteItemProps) {
  const dropZone: DropZone | null =
    activeDropTarget && activeDropTarget.id === note.id ? activeDropTarget.zone : null
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: note.id,
    data: note,
  })

  // The dragged row disables its own droppable so it never targets itself.
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: note.id,
    data: note,
    disabled: isDragging,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 999 : 'auto',
      }
    : undefined

  const hasChildren = note.children.length > 0

  // Whole row owns drag listeners + droppable — grab from anywhere.
  const setRowRef = (node: HTMLDivElement | null) => {
    setNodeRef(node)
    setDroppableRef(node)
  }

  // Indent offset for the drop indicator lines so they visually
  // align with the target's own indent depth (OneNote pattern: the
  // insertion line tells you both where AND at what level the note
  // will land).
  const indentPx = depth * 12 + 8

  return (
    <div className={className}>
      <div
        ref={setRowRef}
        {...attributes}
        {...listeners}
        style={{
          paddingLeft: `${indentPx}px`,
          ...style,
        }}
        className={cn(
          'group relative flex cursor-move select-none items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-[background-color,box-shadow,transform] duration-150',
          isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-zinc-50',
          isMultiSelected && !isSelected && 'bg-[#fff7d1] ring-1 ring-[#f2cc0d]/60',
        )}
        onClick={(e) => onSelect(note, e.ctrlKey || e.metaKey)}
      >
        {/* ABOVE drop indicator — solid brand-yellow line at the top
            edge, starting from the target's indent so the user sees the
            exact column the note lands in. */}
        {dropZone === 'above' && (
          <div
            aria-hidden
            style={{ left: `${indentPx}px` }}
            className="pointer-events-none absolute right-2 top-0 z-50 h-[3px] -translate-y-[1px] rounded-full bg-[#f2cc0d] shadow-[0_0_8px_rgba(242,204,13,0.55)]"
          />
        )}
        {/* BELOW drop indicator — same line at the bottom edge. */}
        {dropZone === 'below' && (
          <div
            aria-hidden
            style={{ left: `${indentPx}px` }}
            className="pointer-events-none absolute bottom-0 right-2 z-50 h-[3px] translate-y-[1px] rounded-full bg-[#f2cc0d] shadow-[0_0_8px_rgba(242,204,13,0.55)]"
          />
        )}

        {/* Expand/Collapse button — only on the top-level row. Sub-notes
            and deeper descendants get an invisible spacer of the same
            width so their content stays aligned past the parent's
            chevron (otherwise the first sub-note falls left of where
            the parent's title started). */}
        {depth === 0 ? (
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
        ) : (
          <span aria-hidden className="block h-5 w-5 shrink-0" />
        )}

        {/* Icon — only render when the user picked a custom one. The
            default 📄 fallback was just visual noise on every row. */}
        {note.icon && <span className="shrink-0 text-base">{note.icon}</span>}

        {/* Title */}
        <span className="flex-1 truncate">{note.title || 'Untitled'}</span>

        {/* Inline quick actions: add sub-note + delete. Render in the
            row to the LEFT of the favorite star so the star always
            anchors the right edge. Opacity + pointer-events gate
            visibility/interaction so the layout doesn't shift on hover.
            Toggle-favorite gets the same treatment for unfavorited
            rows so the user can add a favorite from the row directly. */}
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
            'flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-500 opacity-0 transition-opacity hover:bg-[#fff7d1] hover:text-[#8a7307] group-hover:opacity-100 group-hover:pointer-events-auto pointer-events-none',
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
            'flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-500 opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 group-hover:pointer-events-auto pointer-events-none',
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
            onToggleFavorite(note)
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded transition-opacity hover:bg-[#fff7d1]',
            // Stays put on the far right. When favorited it's always
            // visible; when not, it reveals on hover (still in the same
            // slot, so no layout shift) so the user can flag it from
            // the row without an overflow menu.
            note.isFavorite
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto',
            isSelected && 'hover:bg-black/10',
          )}
        >
          <Star
            className={cn(
              'h-3.5 w-3.5',
              note.isFavorite
                ? 'fill-current text-yellow-500'
                : 'text-zinc-400 hover:text-yellow-500',
            )}
          />
        </button>
      </div>

      {/* Children. At depth 0, respect the chevron's collapsed/expanded
          state. Below the root, always render so the subtree behaves
          like a flat indented outline once the root is opened. */}
      {hasChildren && (depth > 0 || isExpanded) && (
        <div>
          {note.children.map((child) => (
            <NoteItem
              key={child.id}
              note={child}
              depth={depth + 1}
              isExpanded={expandedIds.has(child.id)}
              isSelected={false} // Only highlighting direct selection in recursive render is limiting, better fix in parent
              isMultiSelected={multiSelectIds.has(child.id)}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onCreateSubNote={onCreateSubNote}
              onToggleFavorite={onToggleFavorite}
              onDelete={onDelete}
              multiSelectIds={multiSelectIds}
              activeDropTarget={activeDropTarget}
              className={className}
            />
          ))}
        </div>
      )}
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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [contextMenuNoteId, setContextMenuNoteId] = useState<string | null>(null)
  const [deleteConfirmNoteId, setDeleteConfirmNoteId] = useState<string | null>(null)
  // Multi-select via Ctrl/Cmd-click. A plain click clears this set
  // and behaves like before (open the doc). Modifier-click toggles
  // membership without opening the doc, so the user can mark several
  // notes and delete them as a batch from the floating toolbar.
  const [multiSelectIds, setMultiSelectIds] = useState<Set<string>>(new Set())
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)

  // Initialize expandedIds from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('dw-notes-expanded-ids')
      if (stored) {
        setExpandedIds(new Set(JSON.parse(stored)))
      }
    } catch {
      toast.error('Failed to load saved data')
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

  // DnD Logic — OneNote-style drop zones, no axis lock, no horizontal swipe.
  const [activeNote, setActiveNote] = useState<NoteTreeItem | null>(null)
  const [activeDropTarget, setActiveDropTarget] = useState<DropTarget | null>(null)

  // Raw pointer Y is the source of truth for zone calculation. dnd-kit
  // doesn't expose live cursor coords during a drag (it tracks the
  // ghost's translated rect), so we install a global pointermove
  // listener for the lifetime of the drag and read from this ref in
  // handleDragOver / handleDragEnd.
  const pointerYRef = useRef(0)
  // Snapshot the dragged note's descendants on drag start so the
  // cycle guard ("can't drop into your own subtree") runs in O(1).
  const descendantsRef = useRef<Set<string>>(new Set())
  // Auto-expand timer: when the pointer hovers a collapsed row's
  // inside-zone, after AUTO_EXPAND_HOVER_MS we expand it so the user
  // can drop into a nested location without manually clicking the
  // chevron first.
  const autoExpandTimerRef = useRef<number | null>(null)
  const autoExpandTargetRef = useRef<string | null>(null)

  const cancelAutoExpand = useCallback(() => {
    if (autoExpandTimerRef.current != null) {
      window.clearTimeout(autoExpandTimerRef.current)
      autoExpandTimerRef.current = null
    }
    autoExpandTargetRef.current = null
  }, [])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
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
    setActiveNote(note)
    setActiveDropTarget(null)

    const freshNotes = queryClient.getQueryData<Note[]>(NOTES_QUERY_KEY) ?? notes
    descendantsRef.current = findDescendantIds(active.id as string, freshNotes)

    // Track raw pointer Y for the rest of the drag.
    const onMove = (ev: PointerEvent) => {
      pointerYRef.current = ev.clientY
    }
    document.addEventListener('pointermove', onMove)
    // Stash the cleanup on a ref so cancel/end can detach.
    pointerCleanupRef.current = () => document.removeEventListener('pointermove', onMove)
  }

  const pointerCleanupRef = useRef<(() => void) | null>(null)

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over || !active || over.id === active.id) {
      if (activeDropTarget !== null) setActiveDropTarget(null)
      cancelAutoExpand()
      return
    }

    const overId = String(over.id)

    // Root drop zones — synthetic; zone label irrelevant, we only use
    // the id at drop time. Pick 'above' for ROOT_TOP and 'below' for
    // ROOT_BOTTOM so the indicator on the strip reads naturally.
    if (overId === ROOT_TOP_ID || overId === ROOT_BOTTOM_ID) {
      const zone: DropZone = overId === ROOT_TOP_ID ? 'above' : 'below'
      if (activeDropTarget?.id !== overId || activeDropTarget.zone !== zone) {
        setActiveDropTarget({ id: overId, zone })
      }
      cancelAutoExpand()
      return
    }

    // Cycle guard.
    if (descendantsRef.current.has(overId)) {
      if (activeDropTarget !== null) setActiveDropTarget(null)
      cancelAutoExpand()
      return
    }

    const rect = over.rect as unknown as DOMRect
    const rawZone = zoneFromPointer(pointerYRef.current, rect)
    const resolved = resolveDropTarget(
      notes,
      overId,
      rawZone,
      String(active.id),
      expandedIds,
    )

    if (activeDropTarget?.id !== resolved.id || activeDropTarget.zone !== resolved.zone) {
      setActiveDropTarget(resolved)
    }

    // Auto-expand: hovering a collapsed parent for AUTO_EXPAND_HOVER_MS
    // expands it so the user can target one of its children for the
    // sibling reorder. Fires regardless of zone — we just need the
    // user lingering on a collapsed row.
    const isCollapsedParent =
      !expandedIds.has(overId) && notes.some((n: Note) => n.parentId === overId)
    if (isCollapsedParent) {
      if (autoExpandTargetRef.current !== overId) {
        cancelAutoExpand()
        autoExpandTargetRef.current = overId
        autoExpandTimerRef.current = window.setTimeout(() => {
          setExpandedIds((prev) => {
            const next = new Set(prev)
            next.add(overId)
            return next
          })
          autoExpandTimerRef.current = null
          autoExpandTargetRef.current = null
        }, AUTO_EXPAND_HOVER_MS)
      }
    } else {
      cancelAutoExpand()
    }
  }

  const cleanupDrag = useCallback(() => {
    setActiveNote(null)
    setActiveDropTarget(null)
    descendantsRef.current = new Set()
    cancelAutoExpand()
    if (pointerCleanupRef.current) {
      pointerCleanupRef.current()
      pointerCleanupRef.current = null
    }
  }, [cancelAutoExpand])

  const handleDragCancel = () => {
    cleanupDrag()
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    const noteId = String(active.id)

    // Snapshot end state up front so any early-return below still
    // tears down the global pointermove listener and cleanup.
    const target = activeDropTarget
    cleanupDrag()

    if (!over) return
    const overId = String(over.id)

    const freshNotes = queryClient.getQueryData<Note[]>(NOTES_QUERY_KEY) ?? notes
    const draggedNote = freshNotes.find((n: Note) => n.id === noteId)
    if (!draggedNote) return

    // ROOT zones land the note as a top-level (parentId = null) note
    // at the very top or the very bottom of the root list.
    if (overId === ROOT_TOP_ID || overId === ROOT_BOTTOM_ID) {
      const roots = freshNotes
        .filter((n: Note) => (n.parentId ?? null) === null && n.id !== noteId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      const next = overId === ROOT_TOP_ID ? [draggedNote, ...roots] : [...roots, draggedNote]
      reorderMutation.mutate(
        next.map((n, i) => ({ noteId: n.id, parentId: null, order: (i + 1) * 1000 })),
      )
      return
    }

    if (overId === noteId) return

    // Cycle guard: never let a note become its own descendant.
    const descendants = descendantsRef.current.size
      ? descendantsRef.current
      : findDescendantIds(noteId, freshNotes)
    if (descendants.has(overId)) {
      toast.error("Can't move a note into its own descendant")
      return
    }

    // Re-derive the zone from the final event geometry — `target` from
    // state could be one render stale on a fast release, but the rects
    // on the event itself are always current. Then apply the
    // "drop-below-expanded-parent = drop-above-its-first-child"
    // resolution so the effective target matches what handleDragOver
    // showed in the indicator.
    let rawZone: DropZone = target?.id === overId && target?.zone ? target.zone : 'below'
    const overRect = (over.rect as unknown as DOMRect | undefined) ?? null
    if (overRect) {
      rawZone = zoneFromPointer(pointerYRef.current, overRect)
    }
    const resolved = resolveDropTarget(freshNotes, overId, rawZone, noteId, expandedIds)
    const resolvedOverId = resolved.id
    const zone = resolved.zone

    const targetNote = freshNotes.find((n: Note) => n.id === resolvedOverId)
    if (!targetNote) return

    // Sibling reorder. Land in the target's parent list immediately
    // before or after the target row. (No drag-to-nest — nesting is
    // done via the per-row "+ sub-note" button, matching OneNote.)
    const targetParentId = targetNote.parentId ?? null
    const siblings = freshNotes
      .filter((n: Note) => (n.parentId ?? null) === targetParentId && n.id !== noteId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    const targetIndex = siblings.findIndex((n: Note) => n.id === resolvedOverId)
    const insertAt =
      targetIndex === -1
        ? siblings.length
        : zone === 'above'
          ? targetIndex
          : targetIndex + 1
    siblings.splice(insertAt, 0, draggedNote)

    reorderMutation.mutate(
      siblings.map((n, i) => ({
        noteId: n.id,
        parentId: targetParentId,
        order: (i + 1) * 1000,
      })),
    )
  }

  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Tight distance threshold = drag starts on a small wrist movement
      // without firing on accidental click jiggle.
      activationConstraint: { distance: 4 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  )

  // Body cursor + selection lock during a drag. Pure cosmetics: shows
  // the move-cross cursor everywhere (not just on the row) and stops
  // text from being accidentally selected while the user is dragging.
  useEffect(() => {
    if (activeNote) {
      document.body.style.cursor = 'move'
      document.body.style.userSelect = 'none'
    } else {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    return () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [activeNote])

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

  const confirmDeleteNote = async () => {
    if (!deleteConfirmNoteId) return
    const targetId = deleteConfirmNoteId
    const target = notes.find((n) => n.id === targetId)
    if (!target) {
      setDeleteConfirmNoteId(null)
      return
    }

    // Re-parent direct children to the target's parent BEFORE we
    // delete the target — otherwise the DB cascade would drag them
    // down with their parent. The user wants only the target row
    // removed; its children should pop up one level and stay.
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
        // cascade will then take children down with the parent
        // (server-truthful behaviour, not silently lost).
      }
    }

    // Snapshot the deleted note for the Undo toast (re-create from
    // the snapshot if the user clicks Undo within 10s). Captures
    // title / content / icon / color / parentId / order.
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

  // Open the doc on a plain click; ctrl/cmd-click toggles the note in
  // the multi-select set without opening anything, so the user can
  // mark several notes and delete them together. A plain click also
  // clears any existing multi-select so the user doesn't have a stale
  // selection hanging around once they move on.
  const handleNoteClick = (note: Note, modifier: boolean) => {
    if (modifier) {
      setMultiSelectIds((prev) => {
        const next = new Set(prev)
        if (next.has(note.id)) next.delete(note.id)
        else next.add(note.id)
        return next
      })
      return
    }
    if (multiSelectIds.size > 0) setMultiSelectIds(new Set())
    onSelectNote(note)
  }

  const clearMultiSelect = () => setMultiSelectIds(new Set())

  const performBulkDelete = async () => {
    const ids = Array.from(multiSelectIds)
    if (ids.length === 0) return
    // Server cascades children when a parent is deleted; we still
    // fire one mutation per top-level selected id sequentially so the
    // cache invalidation matches what useDeleteNoteMutation already
    // wires up.
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

  const renderNoteItem = (note: NoteTreeItem, depth = 0) => {
    return (
      <NoteItem
        key={note.id}
        note={note}
        depth={depth}
        isExpanded={expandedIds.has(note.id)}
        isSelected={selectedNoteId === note.id}
        isMultiSelected={multiSelectIds.has(note.id)}
        expandedIds={expandedIds}
        onSelect={handleNoteClick}
        onToggleExpand={toggleExpanded}
        onCreateSubNote={handleCreateNote}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDeleteNote}
        multiSelectIds={multiSelectIds}
        activeDropTarget={activeDropTarget}
      />
    )
  }

  // Live drop-target pill copy.
  const previewLabel = (() => {
    if (!activeDropTarget) return 'Drag to move'
    if (activeDropTarget.id === ROOT_TOP_ID) return 'Top of the list'
    if (activeDropTarget.id === ROOT_BOTTOM_ID) return 'Bottom of the list'
    const target = notes.find((n: Note) => n.id === activeDropTarget.id)
    const title = target?.title || 'Untitled'
    return activeDropTarget.zone === 'above' ? `Above "${title}"` : `Below "${title}"`
  })()

  const previewArrow = (() => {
    // Reserved for future indicators (e.g. nest-via-modifier). Empty
    // for plain above/below — the row indicator carries the meaning.
    return ''
  })()

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

      {/* New Note button — optimistic, no disabled state. The new row
          shows up in the tree instantly via the mutation's onMutate. */}
      <div className="px-3 pb-2">
        <button
          onClick={() => handleCreateNote()}
          className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-muted hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          New Note
        </button>
      </div>

      {/* Multi-select discoverability — the floating delete bar at the
          bottom of a long list isn't obvious. A persistent hint above
          the tree teaches the shortcut, and an inline selection chip
          at the top mirrors the bottom bar's count + delete so users
          don't have to scroll to act on a selection. */}
      {multiSelectIds.size === 0 ? (
        <div className="hidden px-3 pb-1.5 text-[10.5px] leading-tight text-muted-foreground sm:block">
          Tip: hold <kbd className="rounded border border-zinc-200 bg-white px-1 py-0.5 font-mono text-[10px] text-zinc-700">Ctrl</kbd> /<kbd className="rounded border border-zinc-200 bg-white px-1 py-0.5 font-mono text-[10px] text-zinc-700">⌘</kbd> + click to select multiple notes.
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

      {/* Notes tree */}
      <DndContext
        sensors={sensors}
        collisionDetection={notesCollision}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        measuring={{
          // WhileDragging is the sweet spot: we get fresh rects exactly
          // when we need them (during a drag) without dnd-kit
          // re-measuring every droppable on every frame at idle, which
          // was a measurable source of the user-reported "lag".
          droppable: {
            strategy: MeasuringStrategy.WhileDragging,
          },
        }}
      >
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
                      handleToggleFavorite(note)
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
              // Flat list for search results - No DnD in search view for now
              filteredNotes.length > 0 ? (
                filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors cursor-pointer',
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
            ) : // Tree view for normal display
            noteTree.length > 0 ? (
              <div className="flex flex-col gap-0.5">
                {/* ROOT drop zone (top) — appears as a thin spacer at
                    the top of the tree; only renders a visible line
                    while a drag is active. Lets the user drop into
                    the very top of the root list explicitly. */}
                <RootDropZone id={ROOT_TOP_ID} activeDropTarget={activeDropTarget} active={!!activeNote} />
                {noteTree.map((note) => renderNoteItem(note))}
                {/* ROOT drop zone (bottom) — same idea at the bottom. */}
                <RootDropZone id={ROOT_BOTTOM_ID} activeDropTarget={activeDropTarget} active={!!activeNote} />
              </div>
            ) : (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No notes yet. Create your first note!
              </div>
            )}
          </div>
        </div>

        {/* Live drop-target pill — brand-yellow card at the bottom of
            the sidebar that says exactly what will happen if the user
            releases now ("Above 'X'", "Sub-note of 'Y'", "Top of the
            list"). Disappears the instant the drag ends. */}
        {activeNote && (
          <div className="pointer-events-none absolute bottom-3 left-3 z-40 max-w-[16rem]">
            <div
              role="status"
              aria-live="polite"
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-lg transition-colors',
                activeDropTarget ? 'bg-[#f2cc0d] text-zinc-900' : 'bg-zinc-900 text-zinc-300',
              )}
            >
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-zinc-900" />
              <span className="truncate">
                {previewArrow}
                {previewLabel}
              </span>
            </div>
          </div>
        )}

        <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
          {activeNote ? (
            <div className="flex max-w-[14rem] cursor-grabbing items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm font-medium text-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.15),0_0_0_2px_rgba(242,204,13,0.4)]">
              {activeNote.icon && <span className="shrink-0 text-base">{activeNote.icon}</span>}
              <span className="flex-1 truncate">{activeNote.title || 'Untitled'}</span>
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

      {/* Bulk delete confirmation (for multi-select) */}
      <ConfirmDialog
        open={showBulkDeleteConfirm}
        onOpenChange={(open) => !open && setShowBulkDeleteConfirm(false)}
        title={`Delete ${multiSelectIds.size} notes?`}
        description="Each note and all its children will be deleted. This action cannot be undone."
        onConfirm={performBulkDelete}
        confirmButtonText={`Delete ${multiSelectIds.size}`}
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />

      {/* Floating multi-select action bar — appears whenever 1+ notes
          are ctrl-clicked. Stays anchored at the bottom of the sidebar
          so the user can scan their selection and clear / delete from
          a single fixed surface. */}
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

/**
 * Tiny droppable zone rendered at the very top and very bottom of the
 * tree. While idle it's an 8px invisible spacer; during a drag it
 * shows a thin dashed yellow zone with a "Drop here" hint when the
 * pointer is over it. Lets the user explicitly land a note at the
 * root level without having to drop above/below another root row.
 */
function RootDropZone({
  id,
  active,
  activeDropTarget,
}: {
  id: string
  active: boolean
  activeDropTarget: DropTarget | null
}) {
  const { setNodeRef } = useDroppable({ id })
  const isHot = activeDropTarget?.id === id
  if (!active) {
    // Invisible during idle so the tree layout is unchanged when no drag.
    return <div ref={setNodeRef} aria-hidden className="h-2" />
  }
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'mx-2 my-1 rounded-md border border-dashed text-center text-[10px] font-medium uppercase tracking-wider transition-colors',
        isHot
          ? 'border-[#f2cc0d] bg-[#f2cc0d]/15 py-2 text-[#8a7307]'
          : 'border-zinc-200 py-1.5 text-zinc-400',
      )}
    >
      {isHot
        ? id === ROOT_TOP_ID
          ? '↑ Top of the list'
          : '↓ Bottom of the list'
        : id === ROOT_TOP_ID
          ? 'Drop here for top'
          : 'Drop here for bottom'}
    </div>
  )
}
