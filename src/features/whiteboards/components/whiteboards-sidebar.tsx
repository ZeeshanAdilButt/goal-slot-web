'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { Plus, Search, Star, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Loading } from '@/components/ui/loading'
import { ConfirmDialog } from '@/components/confirm-dialog'

import {
  useCreateWhiteboardMutation,
  useDeleteWhiteboardMutation,
  useUpdateWhiteboardMutation,
  useWhiteboardsQuery,
} from '../hooks/use-whiteboards'
import type { WhiteboardSummary } from '../types'

interface WhiteboardsSidebarProps {
  selectedWhiteboardId: string | null
  onSelectWhiteboard: (whiteboard: WhiteboardSummary) => void
  /** Called when the currently selected whiteboard was deleted. */
  onAfterDeleteSelected?: () => void
  className?: string
  /** When set, focus title input for this id (e.g. after create). */
  focusTitleId?: string | null
}

export function WhiteboardsSidebar({
  selectedWhiteboardId,
  onSelectWhiteboard,
  onAfterDeleteSelected,
  className,
  focusTitleId,
}: WhiteboardsSidebarProps) {
  const { data: whiteboards = [], isLoading } = useWhiteboardsQuery()
  const createMutation = useCreateWhiteboardMutation()
  const updateMutation = useUpdateWhiteboardMutation()
  const deleteMutation = useDeleteWhiteboardMutation()
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [deleteConfirmWhiteboardId, setDeleteConfirmWhiteboardId] = useState<string | null>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const filtered = whiteboards.filter((w) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return w.title.toLowerCase().includes(q)
  })

  useEffect(() => {
    if (focusTitleId && focusTitleId === selectedWhiteboardId) {
      const wb = whiteboards.find((w) => w.id === focusTitleId)
      if (wb) {
        setEditingId(focusTitleId)
        setEditTitle(wb.title || 'Untitled')
      }
    }
  }, [focusTitleId, selectedWhiteboardId, whiteboards])

  useEffect(() => {
    if (editingId && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [editingId])

  const handleCreate = () => {
    createMutation.mutate({ title: 'Untitled' }, { onSuccess: (wb) => onSelectWhiteboard(wb) })
  }

  const commitTitle = useCallback(
    (id: string, title: string) => {
      const trimmed = title.trim() || 'Untitled'
      updateMutation.mutate({ id, data: { title: trimmed } })
      setEditingId(null)
    },
    [updateMutation],
  )

  const startEdit = (wb: WhiteboardSummary, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(wb.id)
    setEditTitle(wb.title || 'Untitled')
  }

  const handleToggleFavorite = (wb: WhiteboardSummary) => {
    updateMutation.mutate({
      id: wb.id,
      data: { isFavorite: !wb.isFavorite },
    })
  }

  const handleDeleteWhiteboard = (whiteboardId: string) => {
    setDeleteConfirmWhiteboardId(whiteboardId)
  }

  const confirmDeleteWhiteboard = () => {
    if (!deleteConfirmWhiteboardId) return
    const targetId = deleteConfirmWhiteboardId
    const target = whiteboards.find((w) => w.id === targetId)
    if (!target) {
      setDeleteConfirmWhiteboardId(null)
      return
    }

    deleteMutation.mutate(targetId, {
      onSuccess: () => {
        if (selectedWhiteboardId === targetId) {
          const remaining = whiteboards.filter((w) => w.id !== targetId)
          const next = remaining[0]
          if (next) {
            onSelectWhiteboard(next)
          } else {
            onAfterDeleteSelected?.()
          }
        }
      },
    })
    setDeleteConfirmWhiteboardId(null)
  }

  const renderFavoriteRow = (wb: WhiteboardSummary) => {
    const isSelected = selectedWhiteboardId === wb.id
    return (
      <div
        key={`fav-${wb.id}`}
        role="button"
        tabIndex={0}
        onClick={() => onSelectWhiteboard(wb)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSelectWhiteboard(wb)
        }}
        className={cn(
          'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
          isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
        )}
      >
        {wb.icon && <span className="text-base">{wb.icon}</span>}
        <span className="flex-1 truncate">{wb.title || 'Untitled'}</span>
        <button
          type="button"
          title="Remove from favorites"
          aria-label="Remove from favorites"
          onClick={(e) => {
            e.stopPropagation()
            handleToggleFavorite(wb)
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors hover:bg-[#fff7d1]"
        >
          <Star className="h-3.5 w-3.5 fill-current text-yellow-500" />
        </button>
      </div>
    )
  }

  const renderWhiteboardRow = (wb: WhiteboardSummary) => {
    const isSelected = selectedWhiteboardId === wb.id
    const isEditing = editingId === wb.id
    return (
      <div
        key={wb.id}
        role="button"
        tabIndex={0}
        onClick={() => !isEditing && onSelectWhiteboard(wb)}
        onDoubleClick={(e) => startEdit(wb, e)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !isEditing) onSelectWhiteboard(wb)
        }}
        className={cn(
          'group mb-0.5 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
          isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-zinc-50',
        )}
      >
        {wb.icon && <span className="shrink-0 text-base">{wb.icon}</span>}
        {isEditing ? (
          <input
            ref={titleInputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={() => commitTitle(wb.id, editTitle)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle(wb.id, editTitle)
              if (e.key === 'Escape') setEditingId(null)
              e.stopPropagation()
            }}
            onClick={(e) => e.stopPropagation()}
            className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-1 py-0.5 text-sm text-zinc-900 outline-none"
          />
        ) : (
          <span className="flex-1 truncate">{wb.title || 'Untitled'}</span>
        )}
        {!isEditing && (
          <>
            <button
              type="button"
              title="Delete whiteboard"
              aria-label="Delete whiteboard"
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteWhiteboard(wb.id)
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
              title={wb.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-label={wb.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-pressed={wb.isFavorite}
              onClick={(e) => {
                e.stopPropagation()
                handleToggleFavorite(wb)
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded transition-opacity hover:bg-[#fff7d1]',
                wb.isFavorite
                  ? 'opacity-100'
                  : 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100',
                isSelected && 'hover:bg-black/10',
              )}
            >
              <Star
                className={cn(
                  'h-3.5 w-3.5',
                  wb.isFavorite ? 'fill-current text-yellow-500' : 'text-zinc-400 hover:text-yellow-500',
                )}
              />
            </button>
          </>
        )}
      </div>
    )
  }

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
    <div className={cn('flex h-full flex-col', className)}>
      <div className="border-b border-zinc-200 px-3 py-2">
        <h2 className="text-sm font-semibold text-zinc-900">Whiteboards</h2>
      </div>

      <div className="p-3">
        <button
          type="button"
          onClick={handleCreate}
          className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-muted hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          New Whiteboard
        </button>
      </div>

      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search whiteboards..."
            className="w-full rounded-md border border-zinc-200 bg-background py-1.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {whiteboards.filter((w) => w.isFavorite).length > 0 && !searchQuery.trim() && (
          <div className="mb-4">
            <div className="mb-1 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Favorites</div>
            {whiteboards.filter((w) => w.isFavorite).map((wb) => renderFavoriteRow(wb))}
          </div>
        )}

        <div className="mb-1 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {searchQuery.trim() ? 'Search Results' : 'All Whiteboards'}
        </div>
        {filtered.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            {searchQuery.trim() ? 'No whiteboards found' : 'No whiteboards yet. Create one!'}
          </div>
        ) : (
          filtered.map((wb) => renderWhiteboardRow(wb))
        )}
      </div>

      <ConfirmDialog
        open={!!deleteConfirmWhiteboardId}
        onOpenChange={(open) => !open && setDeleteConfirmWhiteboardId(null)}
        title="Delete Whiteboard"
        description="Are you sure you want to delete this whiteboard? This cannot be undone."
        onConfirm={confirmDeleteWhiteboard}
        confirmButtonText="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
