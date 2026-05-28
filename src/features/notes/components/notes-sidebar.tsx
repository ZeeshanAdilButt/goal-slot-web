'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragOverlay,
  DragStartEvent,
  MeasuringStrategy,
  type Modifier,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
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
import { Loading } from '@/components/ui/loading'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ConfirmDialog } from '@/components/confirm-dialog'

import {
  useCreateNoteMutation,
  useDeleteNoteMutation,
  useNotesQuery,
  useReorderNotesMutation,
  useUpdateNoteMutation,
} from '../hooks/use-notes'
import { buildNoteTree, Note, NOTE_ICONS, NoteTreeItem } from '../utils/types'

interface NotesSidebarProps {
  selectedNoteId: string | null
  onSelectNote: (note: Note) => void
  className?: string
}

type DropPosition = 'top' | 'inside' | 'bottom' | null

// Threshold (px) for horizontal-swipe promote/demote. Mirrored in
// handleDragEnd so the live preview always agrees with the on-drop
// behaviour. Lifted to module scope so resolveDropTarget can reuse it.
const HORIZONTAL_SWIPE_PX = 40

// Once the user has moved more than this many px (in any direction) we
// snap-lock the drag to its dominant axis. OneNote-style: if they
// started moving down, only vertical drops are valid until release.
const AXIS_LOCK_PX = 8

type DragAxis = 'x' | 'y' | null

// Modifier factory: zero out the non-locked axis so the dnd-kit ghost
// only translates along the locked axis. Returned per-render so the
// closure captures the latest axis without restarting the drag.
const verticalOnlyModifier: Modifier = ({ transform }) => ({ ...transform, x: 0 })
const horizontalOnlyModifier: Modifier = ({ transform }) => ({ ...transform, y: 0 })

type DropIntentKind = 'sub-note' | 'promote' | 'sibling' | 'reparent' | 'noop'

interface ResolvedDropTarget {
  kind: DropIntentKind
  parentTitle?: string
  siblingTitle?: string
  // -1 = promote (less indented), 0 = stay, 1 = demote (more indented).
  depthDelta: -1 | 0 | 1
  // Whether the resolution is a horizontal-swipe (drag on the dragged
  // row itself) vs a positional drop on another row. The preview
  // indicator renders differently for the two.
  horizontal: boolean
  // For positional drops, which row the indicator should "attach" to
  // and at what depth in the tree it should visually appear.
  targetId?: string
  targetDepth?: number
  position?: DropPosition
}

// Pure resolver: predicts what handleDragEnd will do given the
// current drag inputs. Used by both the live preview pill and the
// on-drop path, so the user sees exactly what they're about to get.
//
// `lockedAxis` short-circuits classification: when locked to 'y' we
// ignore horizontal delta entirely (no promote/demote), and when
// locked to 'x' we ignore vertical position (no sibling/inside).
function resolveDropTarget(
  activeId: string | null,
  overId: string | null,
  deltaX: number,
  notes: Note[],
  dragState: { id: string; position: DropPosition },
  lockedAxis: DragAxis,
): ResolvedDropTarget {
  if (!activeId) return { kind: 'noop', depthDelta: 0, horizontal: false }
  const dragged = notes.find((n) => n.id === activeId)
  if (!dragged) return { kind: 'noop', depthDelta: 0, horizontal: false }

  const noteDepth = (id: string | null): number => {
    let d = 0
    let cur = id ? notes.find((n) => n.id === id) : null
    while (cur?.parentId) {
      d += 1
      const pid: string = cur.parentId
      cur = notes.find((n) => n.id === pid) ?? null
    }
    return d
  }

  // Horizontal swipe takes precedence when the user isn't hovering
  // a different row (mirrors handleDragEnd's guard). When locked to
  // the vertical axis, horizontal delta is ignored outright — a pure
  // up/down drag must never accidentally promote/demote.
  const effectiveDeltaX = lockedAxis === 'y' ? 0 : deltaX
  const horizontalSwipe =
    lockedAxis !== 'y' && Math.abs(effectiveDeltaX) >= HORIZONTAL_SWIPE_PX
  const hoveringSelfOrNone = !overId || overId === activeId
  if (horizontalSwipe && hoveringSelfOrNone) {
    const draggedDepth = noteDepth(dragged.id)
    if (effectiveDeltaX > 0) {
      // Demote: become child of previous sibling.
      const siblings = notes
        .filter((n) => n.parentId === (dragged.parentId ?? null))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      const idx = siblings.findIndex((n) => n.id === dragged.id)
      const prev = idx > 0 ? siblings[idx - 1] : null
      if (prev) {
        return {
          kind: 'sub-note',
          parentTitle: prev.title || 'Untitled',
          depthDelta: 1,
          horizontal: true,
          targetId: dragged.id,
          targetDepth: draggedDepth + 1,
        }
      }
    } else {
      // Promote: become sibling of current parent.
      const parent = dragged.parentId
        ? notes.find((n) => n.id === dragged.parentId)
        : null
      if (parent) {
        return {
          kind: 'promote',
          depthDelta: -1,
          horizontal: true,
          targetId: dragged.id,
          targetDepth: Math.max(0, draggedDepth - 1),
        }
      }
    }
    return { kind: 'noop', depthDelta: 0, horizontal: true }
  }

  // Positional drop (top / inside / bottom on another row).
  if (!overId || overId === activeId) {
    return { kind: 'noop', depthDelta: 0, horizontal: false }
  }
  const target = notes.find((n) => n.id === overId)
  if (!target) return { kind: 'noop', depthDelta: 0, horizontal: false }
  const hoverPosition: DropPosition = dragState.id === overId ? dragState.position : null

  // Sibling reorder is the default for ANY vertical-dominant drop.
  // dnd-kit captures the pointer during drag, so each row's
  // onMouseMove handler stops firing — `dragState.position` is
  // unreliable mid-drag and was silently turning sibling reorders
  // into reparents. Treat the drop as a sibling reorder whenever:
  //   - the axis is locked to Y, OR
  //   - horizontal delta is below the promote/demote threshold,
  // unless the captured hover position is explicitly 'inside'.
  const isVerticalDominant =
    lockedAxis === 'y' || Math.abs(effectiveDeltaX) < HORIZONTAL_SWIPE_PX
  if (isVerticalDominant && hoverPosition !== 'inside') {
    const position: 'top' | 'bottom' = hoverPosition === 'top' ? 'top' : 'bottom'
    return {
      kind: 'sibling',
      siblingTitle: target.title || 'Untitled',
      depthDelta: 0,
      horizontal: false,
      targetId: overId,
      targetDepth: noteDepth(overId),
      position,
    }
  }

  // Reparent only when the user explicitly hovered the row's center
  // (inside zone) — otherwise it's a sibling reorder.
  return {
    kind: 'reparent',
    parentTitle: target.title || 'Untitled',
    depthDelta: 0,
    horizontal: false,
    targetId: overId,
    targetDepth: noteDepth(overId) + 1,
    position: 'inside',
  }
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
  onHoverStateChange: (id: string, position: DropPosition) => void
  multiSelectIds: Set<string>
  // Live preview hint forwarded from the sidebar's onDragMove. When
  // this row is the resolved drop target, we render an extra preview
  // indicator shifted to the resolved depth so the user sees exactly
  // where the note will land before they release.
  preview?: ResolvedDropTarget | null
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
  onHoverStateChange,
  multiSelectIds,
  preview,
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

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 999 : 'auto',
      }
    : undefined

  // Recursive render helper for children
  const hasChildren = note.children.length > 0

  // Live preview indicator. Active when this row is the resolved
  // target of the in-flight drag. We expose it as a CSS left offset
  // so the yellow guideline visually snaps to the resolved depth —
  // e.g. promote pulls it left, demote pushes it right.
  const showPreview = !!preview && preview.targetId === note.id && preview.kind !== 'noop'
  const previewLeftPx = showPreview ? Math.max(0, (preview!.targetDepth ?? depth)) * 12 + 8 : 0
  const previewPosition: 'top' | 'bottom' | 'inside' =
    preview?.position ??
    (preview?.kind === 'sub-note' || preview?.kind === 'reparent' ? 'inside' : 'bottom')

  return (
    <div className={className}>
      <div
        ref={setRef}
        style={{
          paddingLeft: `${depth * 12 + 8}px`,
          ...style,
        }}
        {...attributes}
        {...listeners}
        onMouseMove={handleMouseMove}
        className={cn(
          'group relative flex items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-[background-color,box-shadow,transform] duration-150 select-none cursor-grab active:cursor-grabbing',
          isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-zinc-50',
          // Multi-select highlight (ctrl/cmd-click): brand-yellow tint
          // + ring so the marked-for-action notes are obvious without
          // colliding with the single-select highlight.
          isMultiSelected && !isSelected && 'bg-[#fff7d1] ring-1 ring-[#f2cc0d]/60',
          isOver && dropPosition === 'inside' && 'bg-[#f2cc0d]/15 ring-2 ring-[#f2cc0d] ring-inset',
        )}
        onClick={(e) => onSelect(note, e.ctrlKey || e.metaKey)}
      >
        {/* Drop Indicators, animated yellow bar for top/bottom inserts */}
        <div
          className={cn(
            'pointer-events-none absolute left-1 right-1 top-0 z-50 h-[3px] rounded-full bg-[#f2cc0d] shadow-[0_0_6px_rgba(242,204,13,0.6)] transition-opacity duration-100',
            isOver && dropPosition === 'top' ? 'opacity-100' : 'opacity-0',
          )}
        />
        <div
          className={cn(
            'pointer-events-none absolute bottom-0 left-1 right-1 z-50 h-[3px] rounded-full bg-[#f2cc0d] shadow-[0_0_6px_rgba(242,204,13,0.6)] transition-opacity duration-100',
            isOver && dropPosition === 'bottom' ? 'opacity-100' : 'opacity-0',
          )}
        />

        {/* Live drop-target preview. Only renders during an in-flight
            drag when the resolver picks this row as the landing spot.
            The left offset is animated so the guideline glides between
            indent levels as the user swipes horizontally. For inside /
            reparent / demote we draw a ring-style cue; for top / bottom
            (sibling) we draw a thin bar at the edge. Both visually
            "snap" to the resolved target depth. */}
        {showPreview && previewPosition !== 'inside' && (
          <div
            style={{ left: `${previewLeftPx}px` }}
            className={cn(
              'pointer-events-none absolute right-1 z-40 h-[2px] rounded-full bg-[#f2cc0d]/80 shadow-[0_0_8px_rgba(242,204,13,0.5)] transition-[left] duration-150 ease-out',
              previewPosition === 'top' ? 'top-0' : 'bottom-0',
            )}
          />
        )}
        {showPreview && previewPosition === 'inside' && (
          <div
            style={{ left: `${previewLeftPx}px` }}
            className="pointer-events-none absolute right-1 top-1/2 z-40 h-[60%] -translate-y-1/2 rounded-md border border-dashed border-[#f2cc0d] bg-[#f2cc0d]/10 transition-[left] duration-150 ease-out"
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
              onHoverStateChange={onHoverStateChange}
              multiSelectIds={multiSelectIds}
              preview={preview}
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
  const [activeNote, setActiveNote] = useState<NoteTreeItem | null>(null)
  // Live horizontal drag delta — kept around so the resolver can see
  // post-lock horizontal motion (and so the dev tools can show it).
  const [dragX, setDragX] = useState(0)
  // OneNote-style axis lock. `null` while the user hasn't moved far
  // enough to commit to a direction; flips to 'x' or 'y' once total
  // movement passes AXIS_LOCK_PX and stays locked until drag end.
  const [lockedAxis, setLockedAxis] = useState<DragAxis>(null)
  const lockedAxisRef = useRef<DragAxis>(null)
  // Live resolved-drop preview, recomputed on every onDragMove tick.
  // Drives the bottom-left pill + the depth-shifted indicator inside
  // the tree. Cleared on drag end so the UI snaps back instantly.
  const [dragPreview, setDragPreview] = useState<ResolvedDropTarget | null>(null)
  // Throttle the preview recompute to ~per-frame so we don't thrash
  // React state on every pointer microtick. rAF is the right cadence
  // for a visual that's purely cosmetic. dragX is fine to set inline
  // since the cursor swap is a cheap body-style write.
  const dragMoveRafRef = useRef<number | null>(null)
  const pendingMoveRef = useRef<{ activeId: string; overId: string | null; deltaX: number } | null>(
    null,
  )

  const dragStateRef = useRef<{ id: string; position: DropPosition }>({ id: '', position: null })

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
    setActiveNote(note)
    setDragPreview(null)
    setLockedAxis(null)
    lockedAxisRef.current = null
  }

  // Single onDragMove handler: cursor swap fires inline (cheap), the
  // preview recompute is coalesced into a single rAF callback so we
  // only re-render once per frame even on a high-poll-rate mouse.
  const handleDragMove = (event: DragMoveEvent) => {
    const { active, over, delta } = event
    const dx = delta?.x ?? 0
    const dy = delta?.y ?? 0
    setDragX(dx)

    // Commit to a dominant axis on the first non-trivial motion.
    // After that, the lock is sticky for the rest of the drag.
    if (lockedAxisRef.current == null) {
      const absX = Math.abs(dx)
      const absY = Math.abs(dy)
      if (absX + absY >= AXIS_LOCK_PX) {
        const axis: DragAxis = absX > absY ? 'x' : 'y'
        lockedAxisRef.current = axis
        setLockedAxis(axis)
      }
    }

    pendingMoveRef.current = {
      activeId: active.id as string,
      overId: (over?.id as string) ?? null,
      deltaX: dx,
    }
    if (dragMoveRafRef.current != null) return
    dragMoveRafRef.current = requestAnimationFrame(() => {
      dragMoveRafRef.current = null
      const pending = pendingMoveRef.current
      if (!pending) return
      const next = resolveDropTarget(
        pending.activeId,
        pending.overId,
        pending.deltaX,
        notes,
        dragStateRef.current,
        lockedAxisRef.current,
      )
      setDragPreview(next)
    })
  }

  const handleDragCancel = () => {
    setActiveNote(null)
    setDragX(0)
    setDragPreview(null)
    setLockedAxis(null)
    lockedAxisRef.current = null
    if (dragMoveRafRef.current != null) {
      cancelAnimationFrame(dragMoveRafRef.current)
      dragMoveRafRef.current = null
    }
    pendingMoveRef.current = null
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event
    const endLockedAxis = lockedAxisRef.current
    setActiveNote(null)
    setDragX(0)
    setDragPreview(null)
    setLockedAxis(null)
    lockedAxisRef.current = null
    if (dragMoveRafRef.current != null) {
      cancelAnimationFrame(dragMoveRafRef.current)
      dragMoveRafRef.current = null
    }
    pendingMoveRef.current = null

    const noteId = active.id as string
    // Resolve drop using the same helper that powered the live
    // preview, so the on-drop behaviour always matches what the user
    // just saw on screen. Pass the axis snapshot captured before we
    // reset state above so the resolver sees the same lock the user
    // had during the drag.
    const resolved = resolveDropTarget(
      noteId,
      (over?.id as string) ?? null,
      delta?.x ?? 0,
      notes,
      dragStateRef.current,
      endLockedAxis,
    )

    const draggedNote = notes.find((n: Note) => n.id === noteId)
    if (!draggedNote) return

    if (resolved.horizontal) {
      // Horizontal promote / demote (mirrors OneNote indent / outdent).
      // Children travel with the dragged note automatically because we
      // only rewrite this note's parentId.
      if (resolved.kind === 'sub-note') {
        const siblings = notes
          .filter((n: Note) => n.parentId === (draggedNote.parentId ?? null))
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        const idx = siblings.findIndex((n) => n.id === noteId)
        const prev = idx > 0 ? siblings[idx - 1] : null
        if (prev) {
          reorderMutation.mutate([{ noteId, parentId: prev.id, order: 99999 }])
        }
        return
      }
      if (resolved.kind === 'promote') {
        const parent = draggedNote.parentId
          ? notes.find((n: Note) => n.id === draggedNote.parentId)
          : null
        if (parent) {
          reorderMutation.mutate([
            { noteId, parentId: parent.parentId ?? null, order: 99999 },
          ])
        }
        return
      }
      // noop: dragged but no valid promote/demote target.
      return
    }

    if (!over || active.id === over.id) return

    // Positional drop. Prefer the resolver's view; fall back to the
    // legacy hover-ref path if the resolver couldn't classify (e.g.
    // because the hover state ref desynced).
    const targetId = over.id as string
    const targetNote = notes.find((n: Note) => n.id === targetId)
    if (!targetNote) return

    const position: DropPosition =
      resolved.kind === 'sibling'
        ? resolved.position ?? null
        : resolved.kind === 'reparent'
          ? 'inside'
          : dragStateRef.current.id === targetId
            ? dragStateRef.current.position
            : 'inside'

    if (!position || position === 'inside') {
      reorderMutation.mutate([
        {
          noteId,
          parentId: targetId,
          order: 99999,
        },
      ])
      return
    }

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
      order: (index + 1) * 1000,
    }))

    reorderMutation.mutate(updates)
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

  // Set body cursor + disable text selection during drag. ARROWS
  // ONLY — never the 4-direction `move` cross. Pre-lock we show the
  // standard grabbing cursor; once axis-locked we switch to the
  // matching one-axis arrow so the user knows exactly which direction
  // the drag is committed to.
  useEffect(() => {
    if (activeNote) {
      const cursor =
        lockedAxis === 'y'
          ? 'ns-resize'
          : lockedAxis === 'x'
            ? 'ew-resize'
            : 'grabbing'
      document.body.style.cursor = cursor
      document.body.style.userSelect = 'none'
    } else {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    return () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [activeNote, lockedAxis])

  // Modifiers passed to DndContext: once the axis lock commits, zero
  // out the off-axis translation so the dnd-kit ghost only moves along
  // the locked direction. Memoised so the array identity is stable
  // across re-renders that don't change the lock.
  const dndModifiers = useMemo<Modifier[]>(() => {
    if (lockedAxis === 'y') return [verticalOnlyModifier]
    if (lockedAxis === 'x') return [horizontalOnlyModifier]
    return []
  }, [lockedAxis])

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
        onHoverStateChange={handleItemHoverStateChange}
        multiSelectIds={multiSelectIds}
        preview={dragPreview}
      />
    )
  }

  // Human-readable label for the live drop-target pill. Keeps the
  // copy centralized so the preview matches the resolver's intent
  // exactly — if a new DropIntentKind is added later, the compiler
  // forces an update here too.
  const previewLabel = (() => {
    if (!dragPreview || dragPreview.kind === 'noop') return 'No change'
    switch (dragPreview.kind) {
      case 'sub-note':
        return `Sub-note of "${dragPreview.parentTitle ?? 'Untitled'}"`
      case 'reparent':
        return `Sub-note of "${dragPreview.parentTitle ?? 'Untitled'}"`
      case 'promote':
        return 'One level up'
      case 'sibling':
        return `${dragPreview.position === 'top' ? 'Above' : 'Below'} "${dragPreview.siblingTitle ?? 'Untitled'}"`
      default:
        return 'No change'
    }
  })()

  const previewArrow = (() => {
    if (!dragPreview) return ''
    if (dragPreview.kind === 'sub-note' || dragPreview.kind === 'reparent') return '→ '
    if (dragPreview.kind === 'promote') return '↑ '
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

      {/* Notes tree */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        modifiers={dndModifiers}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always,
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
              // Wrap in explicit container div although items are already blocked
              <div className="flex flex-col gap-0.5">{noteTree.map((note) => renderNoteItem(note))}</div>
            ) : (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                {/* TODO(human-copy): "No notes yet. Create your first note!" — stock empty-state phrasing + exclamation; rewrite to point at the "New note" affordance with a human voice. */}
                No notes yet. Create your first note!
              </div>
            )}
          </div>
        </div>

        {/* Live drop-target preview pill. Anchored bottom-left of the
            sidebar tree, brand-yellow on zinc-900 so it reads as a
            transient "if you release now…" hint without competing
            with the dragged ghost overlay. Only visible while an
            active drag has resolved to a target. */}
        {activeNote && dragPreview && (
          <div className="pointer-events-none absolute bottom-3 left-3 z-40 max-w-[16rem]">
            <div
              role="status"
              aria-live="polite"
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-lg transition-colors',
                dragPreview.kind === 'noop'
                  ? 'bg-zinc-900 text-zinc-300'
                  : 'bg-[#f2cc0d] text-zinc-900',
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
